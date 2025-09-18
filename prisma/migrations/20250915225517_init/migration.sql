-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "age_range_min" INTEGER NOT NULL,
    "age_range_max" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "family_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "privacy_preferences" JSONB DEFAULT '{"allowPeerComparisons": true, "allowFamilyViewing": false, "shareGoalsWithFamily": false, "shareProgressWithFamily": false, "allowAnonymousDataCollection": true, "dataRetentionConsent": true}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_interests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "subcategory" VARCHAR(50),
    "current_level" INTEGER NOT NULL,
    "intent_level" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skill_history" (
    "id" UUID NOT NULL,
    "user_interest_id" UUID NOT NULL,
    "previous_level" INTEGER,
    "new_level" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retrospective_id" UUID,
    "notes" TEXT,

    CONSTRAINT "skill_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "interest_category" VARCHAR(50) NOT NULL,
    "goal_type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "target_level" INTEGER,
    "timeframe" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target_date" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."retrospectives" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "completed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insights" JSONB,
    "skill_updates" JSONB,
    "goals_reviewed" JSONB,

    CONSTRAINT "retrospectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cohort_stats" (
    "id" UUID NOT NULL,
    "age_range_min" INTEGER NOT NULL,
    "age_range_max" INTEGER NOT NULL,
    "interest_category" VARCHAR(50) NOT NULL,
    "intent_level" VARCHAR(20) NOT NULL,
    "skill_level" INTEGER NOT NULL,
    "user_count" INTEGER NOT NULL,
    "percentile_data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,

    CONSTRAINT "cohort_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_relationships" (
    "id" UUID NOT NULL,
    "parent_user_id" UUID NOT NULL,
    "child_user_id" UUID NOT NULL,
    "relationship_type" VARCHAR(20) NOT NULL DEFAULT 'parent_child',
    "child_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_activity_log" (
    "id" UUID NOT NULL,
    "relationship_id" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "performed_by_user_id" UUID NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_safety_alerts" (
    "id" UUID NOT NULL,
    "relationship_id" UUID NOT NULL,
    "alert_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(6),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_safety_settings" (
    "id" UUID NOT NULL,
    "relationship_id" UUID NOT NULL,
    "enable_activity_alerts" BOOLEAN NOT NULL DEFAULT true,
    "enable_privacy_change_alerts" BOOLEAN NOT NULL DEFAULT true,
    "enable_unusual_activity_detection" BOOLEAN NOT NULL DEFAULT true,
    "require_parent_approval_for_new_connections" BOOLEAN NOT NULL DEFAULT true,
    "max_daily_interaction_time" INTEGER NOT NULL DEFAULT 60,
    "allowed_interaction_hours" JSONB NOT NULL DEFAULT '{"start": "08:00", "end": "20:00"}',
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_safety_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predefined_paths" (
    "id" UUID NOT NULL,
    "interest_category" VARCHAR(50) NOT NULL,
    "path_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "age_range_min" INTEGER,
    "age_range_max" INTEGER,
    "intent_levels" VARCHAR(100)[],
    "stages" JSONB NOT NULL,
    "synergies" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predefined_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_path_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 0,
    "stages_completed" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_path_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."simulation_scenarios" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scenario_name" VARCHAR(255) NOT NULL,
    "effort_allocation" JSONB NOT NULL,
    "forecasted_results" JSONB NOT NULL,
    "timeframe_weeks" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_converted_to_goals" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "simulation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_interests_user_id_category_subcategory_key" ON "public"."user_interests"("user_id", "category", "subcategory");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_stats_age_range_min_age_range_max_interest_category__key" ON "public"."cohort_stats"("age_range_min", "age_range_max", "interest_category", "intent_level", "skill_level");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_parent_user_id_child_user_id_key" ON "public"."family_relationships"("parent_user_id", "child_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_safety_settings_relationship_id_key" ON "public"."family_safety_settings"("relationship_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_path_progress_user_id_path_id_key" ON "public"."user_path_progress"("user_id", "path_id");

-- AddForeignKey
ALTER TABLE "public"."user_interests" ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skill_history" ADD CONSTRAINT "skill_history_user_interest_id_fkey" FOREIGN KEY ("user_interest_id") REFERENCES "public"."user_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skill_history" ADD CONSTRAINT "skill_history_retrospective_id_fkey" FOREIGN KEY ("retrospective_id") REFERENCES "public"."retrospectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."retrospectives" ADD CONSTRAINT "retrospectives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cohort_stats" ADD CONSTRAINT "cohort_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_relationships" ADD CONSTRAINT "family_relationships_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_relationships" ADD CONSTRAINT "family_relationships_child_user_id_fkey" FOREIGN KEY ("child_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_activity_log" ADD CONSTRAINT "family_activity_log_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "public"."family_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_activity_log" ADD CONSTRAINT "family_activity_log_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_safety_alerts" ADD CONSTRAINT "family_safety_alerts_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "public"."family_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_safety_settings" ADD CONSTRAINT "family_safety_settings_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "public"."family_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_path_progress" ADD CONSTRAINT "user_path_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_path_progress" ADD CONSTRAINT "user_path_progress_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."predefined_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."simulation_scenarios" ADD CONSTRAINT "simulation_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
