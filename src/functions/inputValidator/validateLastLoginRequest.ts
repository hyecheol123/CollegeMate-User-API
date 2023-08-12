/**
 * Validate user input - Update Last Login Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';
import addFormat from 'ajv-formats';

export const validateLastLoginRequest = addFormat(
  new Ajv().addFormat('iso-date-time', {
    validate: (dateTimeStr: string) => {
      // Format checks
      if (
        /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/.test(
          dateTimeStr
        )
      ) {
        const isoDateTimeComponents = dateTimeStr.split('T');

        // Date Range Check
        const dateComponents = isoDateTimeComponents[0].split('-');
        // 1 <= Month <= 12
        const month = parseInt(dateComponents[1]);
        if (month < 1 || month > 12) {
          return false;
        }
        // Day range varies with month
        const day = parseInt(dateComponents[2]);
        if (day < 1) {
          return false;
        }
        if ([1, 3, 5, 7, 8, 10, 12].includes(month) && day > 31) {
          return false;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          return false;
        } else if (month === 2) {
          // Check for Leap year
          const year = parseInt(dateComponents[0]);
          if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
            // Leap Year
            if (day > 29) {
              return false;
            }
          } else {
            // Not Leap Year
            if (day > 28) {
              return false;
            }
          }
        }

        // Time Range Check
        const timeComponents = isoDateTimeComponents[1].split(':');
        const hr = parseInt(timeComponents[0]);
        if (hr < 0 || hr >= 24) {
          return false;
        }
        const min = parseInt(timeComponents[1]);
        /* istanbul ignore if */
        if (min < 0 || min >= 60) {
          return false;
        }
        const sec = parseInt(timeComponents[2].split('.')[0]);
        /* istanbul ignore if */
        if (sec < 0 || sec >= 60) {
          return false;
        }

        return true;
      } else {
        return false;
      }
    },
  })
).compile({
  type: 'object',
  properties: {
    lastLogin: {type: 'string', format: 'iso-date-time'},
  },
  required: ['lastLogin'],
  additionalProperties: false,
});
