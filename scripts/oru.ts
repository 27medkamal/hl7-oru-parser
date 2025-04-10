import hl7 from 'tiny-hl7';
import { differenceInYears } from 'date-fns';
import HL7Date from 'hl7-date';
import * as fs from 'fs';

const message = fs
  .readFileSync('prisma/data/MP826520.oru.txt')
  .toString()
  .trim();

const parsed = hl7.parse(message);
// console.log(JSON.stringify(parsed));

const firstName = parsed.find((m) => m['PID.5.1'])['PID.5.2'];
const lastName = parsed.find((m) => m['PID.5.1'])['PID.5.1'];
const age = differenceInYears(
  Date.now(),
  HL7Date.parse(parsed.find((m) => m['PID.7'])['PID.7']),
);
const gender = parsed.find((m) => m['PID.8'])['PID.8'];

console.log({ M: 'Male', F: 'Female' }[gender]);

// OBX.3.2 code
// obx.5 value
// obx.2 type
// obx.6 unit
