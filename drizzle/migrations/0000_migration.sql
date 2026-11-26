
CREATE TABLE public.contests (
  number integer PRIMARY KEY,
  draw_date date,
  bet_start date,
  bet_end date,
  games_start date,
  games_end date,
  status text NOT NULL DEFAULT 'aguardando',
  estimated_prize numeric,
  official_published boolean NOT NULL DEFAULT false,
  results_official boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contests TO anon, authenticated;
GRANT ALL ON public.contests TO service_role;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read contests" ON public.contests FOR SELECT TO anon, authenticated USING (true);

-- Loteca games + association with the sports source (match table)
CREATE TABLE public.loteca_games (
  contest integer NOT NULL REFERENCES public.contests(number) ON DELETE CASCADE,
  seq integer NOT NULL CHECK (seq BETWEEN 1 AND 14),
  home_name text NOT NULL,
  away_name text NOT NULL,
  game_date date,
  official_home_goals integer,
  official_away_goals integer,
  official_result text,
  match_status text NOT NULL DEFAULT 'pendente', -- pendente | validado | ambiguo | nao_encontrado
  match_note text,
  source text,
  source_event_id text,
  source_league text,
  league_name text,
  home_team_id text,
  away_team_id text,
  home_full text,
  away_full text,
  home_logo text,
  away_logo text,
  venue text,
  kickoff timestamptz,
  state text, -- pre | in | post
  status_detail text,
  clock text,
  period integer,
  home_score integer,
  away_score integer,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  live_updated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest, seq)
);
GRANT SELECT ON public.loteca_games TO anon, authenticated;
GRANT ALL ON public.loteca_games TO service_role;
ALTER TABLE public.loteca_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read games" ON public.loteca_games FOR SELECT TO anon, authenticated USING (true);

-- Predictions: frozen once the match starts
CREATE TABLE public.predictions (
  contest integer NOT NULL,
  seq integer NOT NULL,
  p1 numeric NOT NULL,
  px numeric NOT NULL,
  p2 numeric NOT NULL,
  lambda_home numeric,
  lambda_away numeric,
  pick text NOT NULL,
  top_pick text NOT NULL,
  confidence text NOT NULL,
  complete boolean NOT NULL DEFAULT false,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text,
  model_version text NOT NULL,
  kickoff timestamptz,
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest, seq),
  FOREIGN KEY (contest, seq) REFERENCES public.loteca_games(contest, seq) ON DELETE CASCADE
);
GRANT SELECT ON public.predictions TO anon, authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read predictions" ON public.predictions FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.freeze_predictions()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.kickoff IS NOT NULL AND OLD.kickoff <= now() THEN
    RAISE EXCEPTION 'Prognóstico congelado: a partida já começou';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER predictions_freeze BEFORE UPDATE OR DELETE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.freeze_predictions();

-- Saved user tickets (anonymous device id)
CREATE TABLE public.user_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  contest integer NOT NULL,
  strategy text NOT NULL,
  picks jsonb NOT NULL,
  doubles integer NOT NULL,
  triples integer NOT NULL,
  combinations integer NOT NULL,
  cost numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_tickets(device_id);
GRANT ALL ON public.user_tickets TO service_role;
ALTER TABLE public.user_tickets ENABLE ROW LEVEL SECURITY;

-- Sync state / API usage control / failure log
CREATE TABLE public.sync_state (
  key text PRIMARY KEY,
  last_run timestamptz,
  last_ok timestamptz,
  last_error text,
  requests_today integer NOT NULL DEFAULT 0,
  requests_day date
);
GRANT SELECT ON public.sync_state TO anon, authenticated;
GRANT ALL ON public.sync_state TO service_role;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read sync" ON public.sync_state FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.sync_log (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  ok boolean NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sync_log TO service_role;
GRANT USAGE ON SEQUENCE public.sync_log_id_seq TO service_role;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Atomic lock: returns true if caller should run sync now
CREATE OR REPLACE FUNCTION public.try_claim_sync(_key text, _min_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE claimed boolean;
BEGIN
  INSERT INTO public.sync_state(key, last_run) VALUES (_key, now())
  ON CONFLICT (key) DO UPDATE SET last_run = now()
  WHERE public.sync_state.last_run IS NULL OR public.sync_state.last_run < now() - make_interval(secs => _min_seconds)
  RETURNING true INTO claimed;
  RETURN coalesce(claimed, false);
END $$;
REVOKE ALL ON FUNCTION public.try_claim_sync(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_claim_sync(text, integer) TO service_role;
