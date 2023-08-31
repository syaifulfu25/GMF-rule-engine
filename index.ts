import { lastValueFrom } from 'rxjs';
import { EngineRule } from './engine';
import { Employee, PersonalNumberRule, UnitRule } from './rules';

const test: Employee = {
  personalNumber: '800000',
  personalName: 'Asep saipudin',
  personalUnit: 'TDI',
  personalSuperior: {
    personalNumber: '800001',
    personalName: 'Mochammad Dimas Editiya',
    personalUnit: 'DB',
    personalSuperior: null,
    isGmfEmployee: true,
  },
  isGmfEmployee: true,
};

const engine = new EngineRule<Employee>()
  .setTestValue(test) // Set value tobe tested
  .setRules(1, UnitRule) // sequence flow can be defined by index, so it doesnt matter if you wanna make different position of rule set
  .setRules(0, PersonalNumberRule)
  .build();

/**
 * Debugging main
 *
 **/
async function main() {
  const r = await lastValueFrom(engine);
  console.log('-------- MAIN ---------');
  console.log(r);
}

main();
