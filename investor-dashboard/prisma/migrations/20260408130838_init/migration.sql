-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notification_prefs" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_unit" TEXT NOT NULL,
    "cost_of_goods" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "target_margin_pct" REAL NOT NULL,
    "eta" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tracking_number" TEXT,
    "notes" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipment_expenses_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_investor_splits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "split_pct" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipment_investor_splits_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shipment_investor_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "selling_price" REAL NOT NULL,
    "actual_margin_pct" REAL NOT NULL,
    "margin_delta" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipment_sales_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "occurred_at" DATETIME NOT NULL,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipment_milestones_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_reference_key" ON "shipments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_investor_splits_shipment_id_user_id_key" ON "shipment_investor_splits"("shipment_id", "user_id");
