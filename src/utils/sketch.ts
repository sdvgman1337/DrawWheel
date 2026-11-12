import { SketchStroke, SketchPoint } from '../types/index.ts';

export interface SketchHistoryState {
  past: SketchStroke[][];
  present: SketchStroke[];
  future: SketchStroke[][];
}

export function createInitialSketchHistory(): SketchHistoryState {
  return {
    past: [],
    present: [],
    future: [],
  };
}

export function pushStroke(
  state: SketchHistoryState,
  stroke: SketchStroke
): SketchHistoryState {
  if (!stroke.points || stroke.points.length === 0) {
    return state;
  }
  return {
    past: [...state.past, state.present],
    present: [...state.present, stroke],
    future: [],
  };
}

export function undoStroke(state: SketchHistoryState): SketchHistoryState {
  if (state.past.length === 0) {
    return state;
  }
  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, state.past.length - 1);
  return {
    past: newPast,
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoStroke(state: SketchHistoryState): SketchHistoryState {
  if (state.future.length === 0) {
    return state;
  }
  const next = state.future[0];
  const newFuture = state.future.slice(1);
  return {
    past: [...state.past, state.present],
    present: next,
    future: newFuture,
  };
}

export function clearStrokes(state: SketchHistoryState): SketchHistoryState {
  if (state.present.length === 0) {
    return state;
  }
  return {
    past: [...state.past, state.present],
    present: [],
    future: [],
  };
}

/**
 * Renders an array of normalized SketchStrokes onto a 2D canvas context.
 */
export function renderStrokesToContext(
  ctx: CanvasRenderingContext2D,
  strokes: SketchStroke[],
  width: number,
  height: number,
  globalLayerOpacity = 1
) {
  ctx.clearRect(0, 0, width, height);
  if (strokes.length === 0 || width <= 0 || height <= 0) return;

  // Scale stroke size relative to a 1000px baseline so exported high-res PNGs match screen proportions
  const scaleFactor = Math.max(width, height) / 900;

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, stroke.size * scaleFactor);

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = Math.min(1, Math.max(0.05, stroke.opacity * globalLayerOpacity));
    }

    ctx.beginPath();
    const firstPt: SketchPoint = stroke.points[0];
    const startX = firstPt.x * width;
    const startY = firstPt.y * height;
    ctx.moveTo(startX, startY);

    if (stroke.points.length === 1) {
      ctx.lineTo(startX + 0.1, startY + 0.1);
    } else if (stroke.points.length === 2) {
      const secondPt = stroke.points[1];
      ctx.lineTo(secondPt.x * width, secondPt.y * height);
    } else {
      // Smooth quadratic bezier curve through midpoints
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const curr = stroke.points[i];
        const next = stroke.points[i + 1];
        const midX = ((curr.x + next.x) / 2) * width;
        const midY = ((curr.y + next.y) / 2) * height;
        ctx.quadraticCurveTo(curr.x * width, curr.y * height, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x * width, last.y * height);
    }

    ctx.stroke();
    ctx.restore();
  }
}
