#  InnoDB中的行级锁

> **InnoDB 通过索引来定位和锁定行，所以锁的实现机制是作用在索引记录（Index Record）上的。**
## 1. InnoDB 的数据存储方式（聚集索引 Clustered Index）
InnoDB 表是索引组织表 (Index-Organized Table)。表中的数据行**物理上**存储在主键（Primary Key）索引的叶子节点上。这个主键索引就是聚集索引。如果你没有定义主键，InnoDB 会选择一个唯一的非空索引作为聚集索引。如果还没有，InnoDB 会隐式创建一个 6 字节的 ROW_ID 作为聚集索引。
**关键点**： 数据行本身就是聚集索引叶子节点的一部分。
## 2. InnoDB 如何查找和锁定行？
当你执行一个 `UPDATE`, `DELETE`, `SELECT ... FOR UPDATE`, `SELECT ... LOCK IN SHARE MODE` 等需要加锁的操作时，InnoDB 必须先找到需要锁定的行。
**查找过程依赖于索引**
- **使用主键查找**： InnoDB 直接通过聚集索引（主键索引）定位到包含该数据行的叶子节点。
- **使用二级索引（Secondary Index）查找**：InnoDB 先在二级索引中找到对应的索引条目（包含主键值），然后再用这个主键值去聚集索引中查找完整的数据行。
- **没有使用索引（全表扫描）**： InnoDB 会扫描聚集索引的所有叶子节点（即全表数据）

## 3. 锁是加在哪里？
加锁的目标是索引记录： 为了锁定某一行数据，InnoDB 实际上是在定位到该行的那个索引记录上加锁。

**情况一：通过主键（聚集索引）锁定**
查询 UPDATE ... WHERE id = 10；InnoDB 在聚集索引中找到 id=10 的那条索引记录。**由于聚集索引的叶子节点包含了完整的数据行，所以对这条聚集索引记录加锁，就等同于锁定了这行数据**,在这种情况下，说锁加在索引记录上，和你理解的“锁加在叶子节点的记录行上”效果是一致的，因为它们是同一个东西。

**情况二：通过二级索引锁定**
假设 name 列有索引，查询 UPDATE ... WHERE name = '张三'；InnoDB 首先在 name 这个**二级索引**中找到 name='张三' 的索引记录。这条记录通常只包含 name 的值和对应的主键值（比如 id=10）。InnoDB 会先对这条**二级索引记录加锁**（通常是 Next-Key Lock，防止幻读）。然后，InnoDB 使用从二级索引记录中获取的主键值 (id=10)，再去聚集索引中查找对应的索引记录（也就是完整的数据行）。**InnoDB 会对这条聚集索引记录也加上锁。**
**关键点：** 在这个过程中，锁是明确地加在了两个不同索引的索引记录上。这清晰地表明了锁是作用于索引结构之上的。
> 这里有个问题，为什么二级索引锁定，锁了两个地方？<mark>二级索引的索引记录</mark> 和 <mark>聚簇索引的索引记录</mark>。

答案：

<font color="#ff0000" size="4" face="微软雅黑">主要是为了保证事务的隔离性，特别是防止幻读 (Phantom Reads)，尤其是在默认的可重复读 (Repeatable Read, RR) 隔离级别下。</font>

<font color="#0000ff" size="3" face="微软雅黑">场景：防止幻读 (Phantom Reads)</font>
假设我们有表 products：
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT,
  price DECIMAL(10, 2),
  INDEX idx_category (category_id) -- 二级索引
);

INSERT INTO products (category_id, price) VALUES (10, 50.00), (10, 100.00), (20, 200.00);
```
现在考虑两个事务，在 Repeatable Read 隔离级别下：
事务 A (Tx A): 想要查询并锁定所有 `category_id = 10 `的产品，防止它们被修改或删除，并且防止新的 `category_id = 10` 的产品被插入。
```sql
-- Tx A
START TRANSACTION;
SELECT * FROM products WHERE category_id = 10 FOR UPDATE;
```
事务 B (Tx B): 想要插入一个新的 category_id = 10 的产品。
```sql
-- Tx B
START TRANSACTION;
INSERT INTO products (category_id, price) VALUES (10, 75.00);
COMMIT;
```
**分析如果只锁聚簇索引：**

1. **Tx A 执行 `SELECT ... FOR UPDATE`:**

    *   InnoDB 使用二级索引 `idx_category` 找到 `category_id = 10` 的记录。它找到了对应主键 `id` 的两条记录（假设是 id=1 和 id=2）。
    *   InnoDB **只**去聚簇索引中锁定 `id=1` 和 `id=2` 这两条数据行。它**不锁定**二级索引 `idx_category` 中 `category_id = 10` 的条目或它们之间的间隙。

2. **Tx B 执行 `INSERT`:**

    *   Tx B 尝试插入 `(category_id=10, price=75.00)`。
    *   它需要更新聚簇索引（插入新行，假设得到 id=3）。
    *   它还需要更新二级索引 `idx_category`，在 `category_id = 10` 的条目附近插入新的索引记录 `(10, 3)`。
    *   **关键问题：** 因为 Tx A **没有**在二级索引 `idx_category` 上对 `category_id = 10` 这个范围加锁（特别是没有加间隙锁 Gap Lock），Tx B 的插入操作在二级索引层面**不会被阻塞**！它也**不会**在聚簇索引层面被阻塞，因为它插入的是一个全新的行 `id=3`，而 Tx A 只锁定了 `id=1` 和 `id=2`。
    *   Tx B 成功 `COMMIT`。

3. **Tx A 再次执行查询 (在同一个事务内):**

   ```sql
   -- Tx A (同一事务内，稍后)
   SELECT * FROM products WHERE category_id = 10 FOR UPDATE;
   ```

    *   Tx A 现在会发现**三条**记录 (`id=1`, `id=2`, `id=3`)，而不是它第一次查询时看到的**两条**。
    *   **这就是幻读 (Phantom Read)！** 在同一个事务内，同样的查询返回了不同的行集合。这违反了 Repeatable Read 隔离级别的承诺。

**InnoDB 的正确做法 (锁二级索引 + 锁聚簇索引):**

1.  **Tx A 执行 `SELECT ... FOR UPDATE`:**
    *   InnoDB 使用 `idx_category` 找到 `category_id = 10` 的记录。
    *   它会对 `idx_category` 中 `category_id = 10` 的**索引记录**加上 **Next-Key Lock**。这个锁不仅锁定了现有的 `(10, 1)` 和 `(10, 2)` 这两条二级索引记录，还锁定了它们之间以及它们周围的**间隙 (Gap)**。这意味着，在 `idx_category` 中，不能在 `category_id = 10` 这个值的范围内插入新的条目。
    *   然后，它再去聚簇索引中，对 `id=1` 和 `id=2` 的数据行加上记录锁 (Record Lock)。
2.  **Tx B 执行 `INSERT`:**
    *   Tx B 尝试插入 `(category_id=10, price=75.00)`。
    *   当它尝试在二级索引 `idx_category` 中插入新的 `(10, 3)` 条目时，它会发现这个位置（或者说这个 `category_id = 10` 的范围）已经被 Tx A 的 Next-Key Lock (其中的 Gap Lock 部分) 锁定了。
    *   **Tx B 被阻塞**，直到 Tx A 提交或回滚。
3.  **Tx A 再次执行查询:**
    *   由于 Tx B 被阻塞，Tx A 再次查询时仍然只看到 `id=1` 和 `id=2` 两条记录。
    *   **没有发生幻读**，Repeatable Read 隔离级别得到保证。

**情况三：全表扫描锁定**

查询 `UPDATE ... WHERE non_indexed_col = 'value'`；InnoDB 必须扫描聚集索引。它会检查聚集索引中的每一条索引记录。
对于满足条件的聚集索引记录（也就是数据行），InnoDB 会对其加锁。注意： 即使是全表扫描，锁也是施加在它遍历到的聚集索引记录上的。如果优化不当或隔离级别较高，可能会锁住大量记录甚至整个表。
