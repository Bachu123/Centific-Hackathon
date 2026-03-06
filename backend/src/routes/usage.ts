import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /api/usage/stats
 * Query: period (today, 7d, 30d, all), group_by (service, model, agent)
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || '7d';
    const groupBy = (req.query.group_by as string) || 'service';

    let since: string | null = null;
    const now = new Date();
    if (period === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === '7d') {
      since = new Date(now.getTime() - 7 * 86400000).toISOString();
    } else if (period === '30d') {
      since = new Date(now.getTime() - 30 * 86400000).toISOString();
    }

    let query = supabase
      .from('ai_usage_log')
      .select('service, model, agent_name, input_tokens, output_tokens, cost_usd');

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;
    if (error) { res.status(500).json({ error: error.message }); return; }

    const rows = data || [];

    const totals = {
      total_cost: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_calls: rows.length,
      scout_cost: 0,
      agent_cost: 0,
      moderator_cost: 0,
    };

    const groups: Record<string, { calls: number; input_tokens: number; output_tokens: number; cost: number }> = {};

    for (const row of rows) {
      const cost = Number(row.cost_usd) || 0;
      const inTok = row.input_tokens || 0;
      const outTok = row.output_tokens || 0;

      totals.total_cost += cost;
      totals.total_input_tokens += inTok;
      totals.total_output_tokens += outTok;

      if (row.service === 'scout') totals.scout_cost += cost;
      else if (row.service === 'agent') totals.agent_cost += cost;
      else if (row.service === 'moderator') totals.moderator_cost += cost;

      let key = row.service;
      if (groupBy === 'model') key = row.model;
      else if (groupBy === 'agent') key = row.agent_name || 'system';

      if (!groups[key]) groups[key] = { calls: 0, input_tokens: 0, output_tokens: 0, cost: 0 };
      groups[key].calls++;
      groups[key].input_tokens += inTok;
      groups[key].output_tokens += outTok;
      groups[key].cost += cost;
    }

    const breakdown = Object.entries(groups)
      .map(([name, g]) => ({ name, ...g, cost: Math.round(g.cost * 1000000) / 1000000 }))
      .sort((a, b) => b.cost - a.cost);

    res.json({
      data: {
        ...totals,
        total_cost: Math.round(totals.total_cost * 1000000) / 1000000,
        scout_cost: Math.round(totals.scout_cost * 1000000) / 1000000,
        agent_cost: Math.round(totals.agent_cost * 1000000) / 1000000,
        moderator_cost: Math.round(totals.moderator_cost * 1000000) / 1000000,
        breakdown,
      },
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/usage/timeline
 * Query: period (7d, 30d), granularity auto-detected
 */
router.get('/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || '7d';
    const days = period === '30d' ? 30 : 7;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await supabase
      .from('ai_usage_log')
      .select('service, cost_usd, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const buckets: Record<string, { scout: number; agent: number; moderator: number; total: number }> = {};

    for (const row of data || []) {
      const day = row.created_at.substring(0, 10);
      if (!buckets[day]) buckets[day] = { scout: 0, agent: 0, moderator: 0, total: 0 };
      const cost = Number(row.cost_usd) || 0;
      buckets[day].total += cost;
      if (row.service === 'scout') buckets[day].scout += cost;
      else if (row.service === 'agent') buckets[day].agent += cost;
      else if (row.service === 'moderator') buckets[day].moderator += cost;
    }

    const timeline = Object.entries(buckets)
      .map(([date, costs]) => ({
        date,
        scout: Math.round(costs.scout * 10000) / 10000,
        agent: Math.round(costs.agent * 10000) / 10000,
        moderator: Math.round(costs.moderator * 10000) / 10000,
        total: Math.round(costs.total * 10000) / 10000,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ data: timeline });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/usage/recent
 * Last N usage records
 */
router.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { data, error } = await supabase
      .from('ai_usage_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: data || [] });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
