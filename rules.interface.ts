export enum Operator {
  EQUAL = '===',
  GTE = '>=',
  LTE = '<=',
  NOT_EQUAL = '!==',
  GT = '>',
  LT = '<',
  CONTAINS = ''
}

export type Relation = 'AND' | 'OR';

export enum EventType {
  SUCCESS,
  FAILED,
}

export enum ActionType {
  NEXT,
  URL_CALL,
  PREVIOUS,
  END,
}

/**
 * Describing rules for each process.
 * Define your needs about rules here.
 *
 */
export interface RulesCondition<T> {
  /**
   * Descriptions of fact
   */
  fact: string;

  /**
   * Path of json notated by dot [.]
   *
   * See on https://www.npmjs.com/package/jsonpath-plus
   */
  path: string;

  /**
   * Operator for boolean operations
   *
   */
  operator: Operator;

  /**
   * Value that should be expected on test
   *
   */
  expectedValue: string | number;

  /**
   * Use this to make boolean logic relation
   *
   */
  relation?: { [K in Relation]?: RulesCondition<T>[] };
}

export interface EventAction {
  type: ActionType;
  message: string;
  call: (s: any) => ReturnType<any>;
}

export interface RulesEvent {
  event: EventType;
  action: EventAction;
}

export interface Rules<T extends Object> {
  name: string;
  path?: string;
  condition: RulesCondition<T>;
  on: RulesEvent[];
}
