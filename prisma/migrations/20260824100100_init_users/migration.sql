-- 001_init_users
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_subject_id" UUID NOT NULL,
    "email" TEXT,
    "display_name" TEXT NOT NULL DEFAULT '',
    "auth_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_auth_subject_id_key" ON "users"("auth_subject_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
