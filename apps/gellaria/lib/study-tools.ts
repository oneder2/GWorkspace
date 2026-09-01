export type CalculatorOperator = "+" | "-" | "×" | "÷";
export type CalculatorKey = `${number}` | "." | "C" | "+/-" | "%" | CalculatorOperator | "=";

export type CalculatorState = {
  display: string;
  stored: number | null;
  operator: CalculatorOperator | null;
  waitingForOperand: boolean;
};

export const initialCalculatorState: CalculatorState = {
  display: "0",
  stored: null,
  operator: null,
  waitingForOperand: false,
};

function formatCalculatorValue(value: number) {
  if (!Number.isFinite(value)) return "Error";
  return String(Number(value.toPrecision(10))).slice(0, 12);
}

function calculate(left: number, right: number, operator: CalculatorOperator) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "×") return left * right;
  return right === 0 ? Number.NaN : left / right;
}

export function pressCalculatorKey(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (key === "C") return { ...initialCalculatorState };

  if (/^\d$/.test(key)) {
    const nextDisplay = state.waitingForOperand || state.display === "Error"
      ? key
      : state.display === "0" ? key : `${state.display}${key}`.slice(0, 12);
    return { ...state, display: nextDisplay, waitingForOperand: false };
  }

  if (key === ".") {
    if (state.waitingForOperand || state.display === "Error") return { ...state, display: "0.", waitingForOperand: false };
    if (state.display.includes(".")) return state;
    return { ...state, display: `${state.display}.`.slice(0, 12) };
  }

  if (key === "+/-") {
    if (state.display === "0" || state.display === "Error") return state;
    return { ...state, display: state.display.startsWith("-") ? state.display.slice(1) : `-${state.display}` };
  }

  if (key === "%") {
    return { ...state, display: formatCalculatorValue(Number(state.display) / 100) };
  }

  if (key === "=") {
    if (!state.operator || state.stored === null || state.waitingForOperand) return state;
    return {
      display: formatCalculatorValue(calculate(state.stored, Number(state.display), state.operator)),
      stored: null,
      operator: null,
      waitingForOperand: true,
    };
  }

  const operator = key as CalculatorOperator;
  const currentValue = Number(state.display);
  if (!Number.isFinite(currentValue)) return { ...initialCalculatorState, operator, waitingForOperand: true };
  if (state.operator && state.stored !== null && !state.waitingForOperand) {
    const result = calculate(state.stored, currentValue, state.operator);
    return {
      display: formatCalculatorValue(result),
      stored: result,
      operator,
      waitingForOperand: true,
    };
  }

  return { ...state, stored: currentValue, operator, waitingForOperand: true };
}

export function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export function getRemainingTimerSeconds(deadlineMs: number, nowMs: number) {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
