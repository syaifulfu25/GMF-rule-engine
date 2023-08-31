import { JSONPath } from 'jsonpath-plus';
import {
  catchError,
  from,
  Observable,
  of,
  share,
  switchMap,
  tap,
  zip,
} from 'rxjs';
import {
  ActionType,
  EventType,
  Rules,
  RulesCondition,
} from './rules.interface';

declare global {
  interface Array<T> {
    first(): T;
  }
}

Array.prototype.first = function () {
  if (this.length === 0) {
    return null;
  }

  return this[0];
};

export interface RulesMap<T> {
  order: number;
  rules: Rules<T>;
}

export interface Code {
  order: number;
  code: string;
}

export class EngineRule<T extends object> {
  private rules: RulesMap<T>[] = [];
  private testValue: T;
  private _conditionString: string[] = [];
  private _conditionOrder: Code[] = [];

  constructor() {}

  setTestValue(val: T): this {
    this.testValue = val;
    return this;
  }

  setRules(order: number, rule: Rules<T>): this {
    this.rules.push({
      order: order,
      rules: rule,
    });
    return this;
  }

  private conditionGenerator(_var: any, opr: any, exp: any): string {
    let s = '(';
    s += typeof _var === 'string' ? `"${_var}"` : _var;
    s += opr;
    s += typeof exp === 'string' ? `"${exp}"` : exp;
    s += ')';

    return s;
  }

  private relationOperatorTranslator(op: string): string | null {
    switch (op) {
      case 'AND':
        this._conditionString.push('&&');
        break;
      case 'OR':
        this._conditionString.push('||');
        break;
      default:
        return null;
    }
  }

  private conditionCheck(order: number, rule: Rules<T>): void {
    const relations = rule.condition.relation;

    const domainCondition = this.conditionGenerator(
      JSONPath({
        path: rule.condition.path,
        json: this.testValue,
      })[0],
      rule.condition.operator,
      rule.condition.expectedValue
    );
    this._conditionString.push(domainCondition);

    if (rule.condition.relation !== undefined) {
      Object.keys(relations).forEach((val) => {
        relations[val].forEach((v) => {
          const relationCondition = v as unknown as RulesCondition<T>;
          this._conditionString.push(this.relationOperatorTranslator(val));
          const relationConditionCode = this.conditionGenerator(
            JSONPath({
              path: relationCondition.path.toString(),
              json: this.testValue,
            })[0],
            relationCondition.operator,
            relationCondition.expectedValue
          );
          this._conditionString.push(relationConditionCode);
        });
      });
    }

    this._conditionOrder.push({
      order: order,
      code: this._conditionString.join(' '),
    });

    this._conditionString = [];
  }

  private sortedRules(): RulesMap<T>[] {
    return this.rules.sort((a, b) => a.order - b.order);
  }

  build(): Observable<string | RulesMap<T>> {
    return from(this.sortedRules()).pipe(
      tap((val) => console.warn(`Rule name: ${val.rules.name}`)),
      tap((val) => console.log(`Fact desc: ${val.rules.condition.fact}`)),
      switchMap((val) => {
        this._conditionOrder = [];
        this.conditionCheck(val.order, val.rules);
        return zip(of(val), from(this._conditionOrder));
      }),
      switchMap(([val, code]) => {
        const _ruleCheck: boolean = eval(code.code);

        const actSuccess = val.rules.on
          .filter((v) => v.event === EventType.SUCCESS)
          .first();

        const actFailed = val.rules.on
          .filter((v) => v.event === EventType.FAILED)
          .first();

        if (_ruleCheck) {
          // Finding END
          val.rules.on.forEach((o) => {
            if (
              o.event === EventType.SUCCESS &&
              o.action.type === ActionType.END
            ) {
              console.log('END');
              throw new Error('It was end');
            }
          });
          actSuccess.action.call(val);
        } else {
          actFailed.action.call(val);
          throw new Error(actFailed.action.message);
        }

        return of(val);
      }),
      catchError((error) => {
        console.error('[ERROR]', error);
        return of('Fallback value');
      }),
      share()
    );
  }
}
