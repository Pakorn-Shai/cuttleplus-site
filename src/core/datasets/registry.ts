export interface DatasetColumn {
  name: string;
  type: "INTEGER" | "DECIMAL" | "VARCHAR" | "DATE";
  nullable: boolean;
  description: string;
}

export interface DatasetTable {
  name: string;
  description: string;
  columns: DatasetColumn[];
}

export interface SampleDataset {
  id: string;
  version: string;
  name: string;
  description: string;
  license: string;
  source: string;
  checksum: string;
  schema: DatasetTable[];
  initSql: string;
  sampleQuery: string;
}

export const sampleDatasets = [
  {
    id: "sales",
    version: "1.0.0",
    name: "Sales",
    description: "คำสั่งซื้อจำลองสำหรับฝึก aggregation, filtering และ window functions",
    license: "CC0-1.0",
    source: "Synthetic deterministic dataset maintained by Knowledge Hub",
    checksum: "sha256:f3b499c0195a84dc1c4a8dd671af8a3fb24583d6b9e948b211e223dadb16305e",
    schema: [{
      name: "sales_orders",
      description: "หนึ่งแถวต่อรายการสินค้าในคำสั่งซื้อ",
      columns: [
        { name: "order_id", type: "INTEGER", nullable: false, description: "รหัสคำสั่งซื้อ" },
        { name: "order_date", type: "DATE", nullable: false, description: "วันที่สั่งซื้อ" },
        { name: "region", type: "VARCHAR", nullable: false, description: "ภูมิภาคการขาย" },
        { name: "product", type: "VARCHAR", nullable: false, description: "ชื่อสินค้า" },
        { name: "units", type: "INTEGER", nullable: false, description: "จำนวนหน่วย" },
        { name: "unit_price", type: "DECIMAL", nullable: false, description: "ราคาต่อหน่วย" },
      ],
    }],
    initSql: `CREATE TABLE sales_orders(order_id INTEGER, order_date DATE, region VARCHAR, product VARCHAR, units INTEGER, unit_price DECIMAL(12,2));
INSERT INTO sales_orders VALUES
  (1001, '2026-01-05', 'North', 'Notebook', 4, 89.00),
  (1002, '2026-01-08', 'South', 'Monitor', 2, 249.50),
  (1003, '2026-01-12', 'North', 'Keyboard', 6, 75.00),
  (1004, '2026-02-03', 'East', 'Notebook', 3, 89.00),
  (1005, '2026-02-14', 'West', 'Monitor', 1, 249.50),
  (1006, '2026-02-18', 'South', 'Keyboard', 5, 75.00),
  (1007, '2026-03-02', 'East', 'Monitor', 2, 249.50),
  (1008, '2026-03-09', 'West', 'Notebook', 7, 89.00);`,
    sampleQuery: "SELECT region, SUM(units * unit_price) AS revenue\nFROM sales_orders\nGROUP BY region\nORDER BY revenue DESC",
  },
  {
    id: "inventory",
    version: "1.0.0",
    name: "Inventory",
    description: "สินค้าและความเคลื่อนไหวสต็อกจำลองสำหรับฝึก join และ conditional aggregation",
    license: "CC0-1.0",
    source: "Synthetic deterministic dataset maintained by Knowledge Hub",
    checksum: "sha256:dfed20e67e10d019384d48f38814a2f837a80c22883a92274143c7bb7f3a4025",
    schema: [
      {
        name: "inventory_items",
        description: "ข้อมูลหลักของสินค้า",
        columns: [
          { name: "sku", type: "VARCHAR", nullable: false, description: "รหัสสินค้า" },
          { name: "item_name", type: "VARCHAR", nullable: false, description: "ชื่อสินค้า" },
          { name: "reorder_point", type: "INTEGER", nullable: false, description: "ระดับที่ควรสั่งเพิ่ม" },
        ],
      },
      {
        name: "stock_movements",
        description: "รายการรับเข้าและเบิกออก",
        columns: [
          { name: "movement_id", type: "INTEGER", nullable: false, description: "รหัสรายการ" },
          { name: "sku", type: "VARCHAR", nullable: false, description: "รหัสสินค้าที่เกี่ยวข้อง" },
          { name: "movement_date", type: "DATE", nullable: false, description: "วันที่เคลื่อนไหว" },
          { name: "quantity", type: "INTEGER", nullable: false, description: "ค่าบวกรับเข้า ค่าลบเบิกออก" },
        ],
      },
    ],
    initSql: `CREATE TABLE inventory_items(sku VARCHAR, item_name VARCHAR, reorder_point INTEGER);
INSERT INTO inventory_items VALUES ('A-100', 'Notebook', 10), ('B-200', 'Monitor', 5), ('C-300', 'Keyboard', 8);
CREATE TABLE stock_movements(movement_id INTEGER, sku VARCHAR, movement_date DATE, quantity INTEGER);
INSERT INTO stock_movements VALUES
  (1, 'A-100', '2026-01-01', 30), (2, 'A-100', '2026-01-10', -18),
  (3, 'B-200', '2026-01-02', 12), (4, 'B-200', '2026-01-15', -9),
  (5, 'C-300', '2026-01-03', 20), (6, 'C-300', '2026-01-20', -7);`,
    sampleQuery: "SELECT i.sku, i.item_name, SUM(m.quantity) AS on_hand, i.reorder_point\nFROM inventory_items i\nJOIN stock_movements m USING (sku)\nGROUP BY i.sku, i.item_name, i.reorder_point\nORDER BY i.sku",
  },
  {
    id: "employees-supply-chain",
    version: "1.0.0",
    name: "Employees & Supply Chain",
    description: "พนักงาน ผู้จัดส่ง และ shipment จำลองสำหรับฝึกหลายตาราง",
    license: "CC0-1.0",
    source: "Synthetic deterministic dataset maintained by Knowledge Hub",
    checksum: "sha256:dbf6fe8fbeecf73c0fd8a43a8ac61e9162c0e6e4fa09375aeef8139c81cb8773",
    schema: [
      {
        name: "employees",
        description: "พนักงานผู้ดูแล shipment",
        columns: [
          { name: "employee_id", type: "INTEGER", nullable: false, description: "รหัสพนักงาน" },
          { name: "employee_name", type: "VARCHAR", nullable: false, description: "ชื่อพนักงาน" },
          { name: "team", type: "VARCHAR", nullable: false, description: "ทีมปฏิบัติการ" },
        ],
      },
      {
        name: "shipments",
        description: "shipment จำลองและเวลาส่งจริง",
        columns: [
          { name: "shipment_id", type: "INTEGER", nullable: false, description: "รหัส shipment" },
          { name: "employee_id", type: "INTEGER", nullable: false, description: "ผู้รับผิดชอบ" },
          { name: "supplier", type: "VARCHAR", nullable: false, description: "ผู้จัดส่ง" },
          { name: "planned_days", type: "INTEGER", nullable: false, description: "จำนวนวันที่วางแผน" },
          { name: "actual_days", type: "INTEGER", nullable: false, description: "จำนวนวันที่ใช้จริง" },
        ],
      },
    ],
    initSql: `CREATE TABLE employees(employee_id INTEGER, employee_name VARCHAR, team VARCHAR);
INSERT INTO employees VALUES (1, 'Anan', 'Inbound'), (2, 'Mali', 'Outbound'), (3, 'Kanda', 'Inbound');
CREATE TABLE shipments(shipment_id INTEGER, employee_id INTEGER, supplier VARCHAR, planned_days INTEGER, actual_days INTEGER);
INSERT INTO shipments VALUES
  (501, 1, 'Atlas Parts', 4, 3), (502, 1, 'Blue River', 3, 5),
  (503, 2, 'Atlas Parts', 2, 2), (504, 3, 'Cedar Works', 5, 6),
  (505, 2, 'Blue River', 3, 3), (506, 3, 'Atlas Parts', 4, 4);`,
    sampleQuery: "SELECT e.employee_name, COUNT(*) AS shipments, AVG(s.actual_days - s.planned_days) AS avg_delay_days\nFROM employees e\nJOIN shipments s USING (employee_id)\nGROUP BY e.employee_name\nORDER BY shipments DESC, e.employee_name",
  },
] as const satisfies readonly SampleDataset[];

export type DatasetId = (typeof sampleDatasets)[number]["id"];

export function getSampleDataset(id: string, version?: string) {
  return sampleDatasets.find((dataset) => dataset.id === id && (!version || dataset.version === version));
}
