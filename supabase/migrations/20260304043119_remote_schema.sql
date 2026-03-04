


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bank_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_code" "text" NOT NULL,
    "partner_id" "text" NOT NULL,
    "channel_id" "text" NOT NULL,
    "bank_id" "text" NOT NULL,
    "sub_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "ticket_id" "uuid",
    "amount" numeric NOT NULL,
    "type" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "creator_balances_type_check" CHECK (("type" = ANY (ARRAY['credit'::"text", 'debit'::"text"])))
);


ALTER TABLE "public"."creator_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creators" (
    "id" "uuid" NOT NULL,
    "brand_name" "text",
    "bank_name" "text",
    "bank_account" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "facebook_url" "text",
    "x_url" "text",
    "instagram_url" "text",
    "tiktok_url" "text",
    "address" "text",
    "image_url" "text",
    "description" "text"
);


ALTER TABLE "public"."creators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_staff_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_staff_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."event_staff_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_staffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_staffs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_taxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "is_included" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_taxes_type_check" CHECK (("type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"])))
);


ALTER TABLE "public"."event_taxes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "title" "text",
    "description" "text",
    "location" "text",
    "event_date" "date",
    "event_time" time without time zone,
    "poster_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "sub_category" "text",
    "custom_form" "text",
    "provinsi" "text",
    "kabupaten" "text",
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "total" numeric,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "booking_code" "text",
    "voucher_id" "uuid",
    "discount_amount" numeric DEFAULT 0,
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tanggal_lahir" "date",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'creator'::"text", 'developer'::"text"]))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "name" "text",
    "price" numeric,
    "quota" integer,
    "sold" integer DEFAULT 0,
    "sale_start" timestamp without time zone,
    "sale_end" timestamp without time zone,
    "created_at" "text",
    "status" "text",
    "end_date" "date",
    "start_date" "date",
    "price_net" numeric,
    "price_gross" numeric,
    "description" "text"
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "ticket_type_id" "uuid",
    "qr_code" "text",
    "status" "text" DEFAULT 'unused'::"text",
    "birth_date" "text",
    "email" "text",
    "full_name" "text",
    "gender" "text",
    "notes" "text",
    "phone" numeric,
    "row_one" "text",
    "row_two" "text",
    "row_three" "text",
    "row_four" "text",
    "row_five" "text",
    "row_six" "text",
    "custom_responses" "text",
    CONSTRAINT "tickets_status_check" CHECK (("status" = ANY (ARRAY['unused'::"text", 'used'::"text"])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."transactions_numeric_id_seq"
    START WITH 100001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."transactions_numeric_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "amount" numeric,
    "method" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_provider_data" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_tag_id" "text",
    "paid_at" timestamp with time zone,
    "va_number" "text",
    "expiry_date" timestamp with time zone,
    "numeric_id" bigint DEFAULT "nextval"('"public"."transactions_numeric_id_seq"'::"regclass"),
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text",
    "description" "text",
    "type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "max_discount" numeric,
    "min_purchase" numeric,
    "quota" integer,
    "used_count" integer DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vouchers_type_check" CHECK (("type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"])))
);


ALTER TABLE "public"."vouchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "requested_amount" numeric NOT NULL,
    "approved_amount" numeric,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "event_id" "uuid",
    CONSTRAINT "withdrawal_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'on_progress'::"text", 'approved'::"text", 'paid'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."withdrawal_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "amount" numeric,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "event_id'" "uuid",
    "event_id" "uuid",
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bank_configs"
    ADD CONSTRAINT "bank_configs_bank_code_key" UNIQUE ("bank_code");



ALTER TABLE ONLY "public"."bank_configs"
    ADD CONSTRAINT "bank_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_balances"
    ADD CONSTRAINT "creator_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_staff_invitations"
    ADD CONSTRAINT "event_staff_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_staff_invitations"
    ADD CONSTRAINT "event_staff_invitations_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "public"."event_staffs"
    ADD CONSTRAINT "event_staffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_staffs"
    ADD CONSTRAINT "event_staffs_unique" UNIQUE ("event_id", "staff_id");



ALTER TABLE ONLY "public"."event_taxes"
    ADD CONSTRAINT "event_taxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_code_unique" UNIQUE ("event_id", "code");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_event_staff_invitations_email" ON "public"."event_staff_invitations" USING "btree" ("email");



CREATE INDEX "idx_event_staff_invitations_event_id" ON "public"."event_staff_invitations" USING "btree" ("event_id");



CREATE INDEX "idx_event_staff_invitations_token" ON "public"."event_staff_invitations" USING "btree" ("token");



CREATE INDEX "idx_transactions_payment_tag_id" ON "public"."transactions" USING "btree" ("payment_tag_id");



ALTER TABLE ONLY "public"."creator_balances"
    ADD CONSTRAINT "creator_balances_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id");



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_staff_invitations"
    ADD CONSTRAINT "event_staff_invitations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_staffs"
    ADD CONSTRAINT "event_staffs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_staffs"
    ADD CONSTRAINT "event_staffs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_taxes"
    ADD CONSTRAINT "event_taxes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



CREATE POLICY "Anyone can view invitation by token" ON "public"."event_staff_invitations" FOR SELECT USING (true);



CREATE POLICY "Creators can create invitations for their events" ON "public"."event_staff_invitations" FOR INSERT WITH CHECK (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."creator_id" IN ( SELECT "creators"."id"
           FROM "public"."creators"
          WHERE ("creators"."id" = "auth"."uid"()))))));



CREATE POLICY "Creators can delete their event invitations" ON "public"."event_staff_invitations" FOR DELETE USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."creator_id" IN ( SELECT "creators"."id"
           FROM "public"."creators"
          WHERE ("creators"."id" = "auth"."uid"()))))));



CREATE POLICY "Creators can update their event invitations" ON "public"."event_staff_invitations" FOR UPDATE USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."creator_id" IN ( SELECT "creators"."id"
           FROM "public"."creators"
          WHERE ("creators"."id" = "auth"."uid"()))))));



CREATE POLICY "Creators can view their event invitations" ON "public"."event_staff_invitations" FOR SELECT USING (("event_id" IN ( SELECT "events"."id"
   FROM "public"."events"
  WHERE ("events"."creator_id" IN ( SELECT "creators"."id"
           FROM "public"."creators"
          WHERE ("creators"."id" = "auth"."uid"()))))));



CREATE POLICY "Service role can manage all invitations" ON "public"."event_staff_invitations" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."bank_configs" TO "anon";
GRANT ALL ON TABLE "public"."bank_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_configs" TO "service_role";



GRANT ALL ON TABLE "public"."creator_balances" TO "anon";
GRANT ALL ON TABLE "public"."creator_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_balances" TO "service_role";



GRANT ALL ON TABLE "public"."creators" TO "anon";
GRANT ALL ON TABLE "public"."creators" TO "authenticated";
GRANT ALL ON TABLE "public"."creators" TO "service_role";



GRANT ALL ON TABLE "public"."event_staff_invitations" TO "anon";
GRANT ALL ON TABLE "public"."event_staff_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_staff_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."event_staffs" TO "anon";
GRANT ALL ON TABLE "public"."event_staffs" TO "authenticated";
GRANT ALL ON TABLE "public"."event_staffs" TO "service_role";



GRANT ALL ON TABLE "public"."event_taxes" TO "anon";
GRANT ALL ON TABLE "public"."event_taxes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_taxes" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_numeric_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_numeric_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_numeric_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."vouchers" TO "anon";
GRANT ALL ON TABLE "public"."vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawal_requests" TO "anon";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "banners 1tghu4n_0"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (true);



  create policy "banners 1tghu4n_1"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "banners 1tghu4n_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using (true);



  create policy "banners 1tghu4n_3"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (true);



  create policy "creator-assets fpjb5w_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "creator-assets fpjb5w_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (true);



  create policy "creator-assets fpjb5w_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using (true);



  create policy "creator-assets fpjb5w_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (true);



