import type { Request, Response } from 'express';
import { createSlot, deleteSlot, generateSlots, removeAllSlotsForGame, updateSlot } from '../services/slotService.js';

export async function postSlot(req: Request, res: Response) {
  const { gameId, startHour, endHour, price, active } = req.body as any;
  const slot = await createSlot({ gameId, startHour, endHour, price, active });
  return res.status(201).json({ slot });
}

export async function patchSlot(req: Request, res: Response) {
  const { slotId } = req.params as any;
  const { price, active } = req.body as any;
  const slot = await updateSlot(slotId, { price, active });
  return res.json({ slot });
}

export async function removeSlot(req: Request, res: Response) {
  const { slotId } = req.params as any;
  await deleteSlot(slotId);
  return res.status(204).send();
}

export async function removeAllSlots(req: Request, res: Response) {
  const { gameId } = req.query as any;
  const result = await removeAllSlotsForGame(gameId);
  return res.json(result);
}

export async function postGenerateSlots(req: Request, res: Response) {
  const body = req.body as any;
  const slots = await generateSlots({
    gameId: body.gameId,
    openHour: body.openHour,
    closeHour: body.closeHour,
    durationMins: body.durationMins === '120' ? 120 : 60,
    dayPrice: body.dayPrice,
    peakPrice: body.peakPrice,
    peakStartHour: body.peakStartHour,
    replaceExisting: body.replaceExisting,
  });
  return res.status(201).json({ slots });
}


