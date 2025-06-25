import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';

interface CountryCode {
  flag: string;
  value: string;
  viewValue: string;
  mask: string;
  length: number;
}

@Component({
  selector: 'chi-phone-number',
  templateUrl: './phone-number.component.html',
  styleUrls: ['./phone-number.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class PhoneNumberComponent implements OnInit, OnDestroy {
  //Inputs
  @Input() required = false;
  @Input('control') externalControl!: FormControl;

  hardCodedPhoneNumbers: string[] = ['90078601'];

  //Validator
  phoneNumberValidator = (control: FormControl): { [key: string]: boolean } => {
    const value = control.value.replace(/\D/g, '');

    if (this.selectedCountryCode) {
      const selectedCode = this.countryCodes.find(
        (code) => code.value === this.selectedCountryCode.value,
      );
      const length = selectedCode?.length || 0;

      if (!value && this.required) {
        return { required: true };
      }

      if (value.length != length && value) {
        if (this.hardCodedPhoneNumbers.includes(value)) {
          return {};
        } else {
          return { invalidPhoneNumber: true };
        }
      }
    } else {
      //show error if no country code is selected
      return { invalidPhoneNumber: true };
    }

    return {};
  };

  internalControl = new FormControl('', [this.phoneNumberValidator.bind(this)]);
  private externalChangesSubscription?: Subscription;
  private errorExternalChangesSubscription?: Subscription;
  private errorInternalChangesSubscription?: Subscription;
  private internalChangesSubscription?: Subscription;
  private externalUpdated: boolean = false;

  //Allowed countries
  countryCodes: CountryCode[] = [
    { flag: "/assets/images/flags/us.svg", value: '1', viewValue: '+1', mask: '(###) ###-####', length: 10 }, // USA
    { flag: "/assets/images/flags/pk.svg", value: '92', viewValue: '+92', mask: '###-#######', length: 10 }, // Pakistan
    { flag: "/assets/images/flags/ae.svg", value: '971', viewValue: '+971', mask: '#### #####', length: 9 }, // United Arab Emirates
    { flag: "/assets/images/flags/gb.svg", value: '44', viewValue: '+44', mask: '#### ######', length: 10 }, // UK
    { flag: "/assets/images/flags/in.svg", value: '91', viewValue: '+91', mask: '##########', length: 10 }, // India
  ];

  defaultCountryCode = this.countryCodes[0];

  selectedCountryCode: CountryCode = this.defaultCountryCode;

  //Helper and Override Methods .............................................................
  ngOnInit() {
    if (this.externalControl.value) {
      this.processNumberAndApplyMask(
        this.existingNumbersCheck(this.externalControl.value),
        true,
      );
    }

    this.externalChangesSubscription =
      this.externalControl.valueChanges.subscribe((value) => {
        if (!this.externalUpdated && value) {
          this.processNumberAndApplyMask(
            this.existingNumbersCheck(value),
            true,
          );
        }
      });

    // Subscribe to externalControl's status changes
    this.errorExternalChangesSubscription =
      this.externalControl.statusChanges.subscribe(() => {
        if (this.externalControl.touched) {
          this.internalControl.markAsTouched();
        }
        // Check if errors in externalControl are different from internalControl's errors
        if (
          this.externalControl.errors &&
          JSON.stringify(this.externalControl.errors) !==
          JSON.stringify(this.internalControl.errors)
        ) {
          this.internalControl.setErrors(this.externalControl.errors);
        }
      });

    // Subscribe to internalControl's status changes
    this.errorInternalChangesSubscription =
      this.internalControl.statusChanges.subscribe(() => {
        // Check if errors in internalControl are different from externalControl's errors
        setTimeout(() => {
          this.externalControl.setErrors(this.internalControl.errors);
        }, 50);
      });
  }

  ngOnDestroy() {
    this.externalChangesSubscription?.unsubscribe();
    this.errorExternalChangesSubscription?.unsubscribe();
    this.errorInternalChangesSubscription?.unsubscribe();
    this.internalChangesSubscription?.unsubscribe();
  }

  onCountryCodeChange(event: MatSelectChange): void {
    this.selectedCountryCode =
      this.countryCodes.find((code) => code.value === event.value) ||
      this.defaultCountryCode;
    // Reapply mask with new country code
    if (this.internalControl.value) {
      this.processNumberAndApplyMask(this.internalControl.value);
    }
  }

  fromPaste = false;
  onPaste(event: any) {
    //for now doing nothing special
    this.fromPaste = true;
  }

  updateExternalControl(): void {
    this.externalUpdated = true;
    this.externalControl.setValue(this.getFullNumber());
  }

  getFullNumber(): string {
    const fullNumber = this.internalControl.value
      ? `${this.selectedCountryCode.value}${this.internalControl.value}`
      : '';
    return fullNumber?.replace(/\D/g, '');
  }

  existingNumbersCheck(phoneNumber: string) {
    // If number has no country code
    if (phoneNumber.length <= 10) {
      return '';
    }
    return phoneNumber;
  }

  removeZero(val: string) {
    let value = val.replace(/\D/g, '');
    //we are not allowing leading zeros
    if (
      value.startsWith('0') &&
      value.length >= this.selectedCountryCode.length
    ) {
      return val.slice(1);
    } else {
      return val;
    }
  }

  //Business logic ............................................................................

  onBeforeInput(event: any): void {
    const value = event.target.value;

    // Prevent further digit input if formatted value pass these checks
    const isDigitInput = /\d/.test(event.data);
    const lengthCheck = value.length === this.selectedCountryCode?.mask.length;
    const pasteCheck = !this.fromPaste;
    const selectionCheck = event.target.selectionStart == event.target.selectionEnd

    if (
      lengthCheck &&
      isDigitInput && pasteCheck && selectionCheck
    ) {
      event.preventDefault(); // Prevent the new digit from being entered
      return; // No further processing if input is blocked
    } else {
      this.fromPaste = false;
    }
  }

  onInput(event: any): void {
    const value = event.target.value;
    let oldCursorPos = event.target.selectionStart;

    let formattedValue = value;
    if (!this.hardCodedPhoneNumbers.includes(value)) {
      // Get the formatted value from internal control logic
      formattedValue = this.processNumberAndApplyMask(value);
    }

    // Check if input value is empty, then reset code selection flag
    // if (!value.replace(/\D/g, '')) {
    //   this.selectedCountryCode = this.defaultCountryCode;
    // }


    // Move the cursor after applying the mask
    const newCursorPos = this.moveCursor(oldCursorPos, value, formattedValue);
    event.target.value = formattedValue;
    event.target.selectionStart = event.target.selectionEnd = newCursorPos;
  }

  processNumberAndApplyMask(
    phoneNumber: string,
    autoSelectCountryCode: boolean = false,
  ): string {
    // Extract code and number if needed and update accordingly

    const codeAndNumber = this.separateCodeAndNumber(
      phoneNumber,
      autoSelectCountryCode,
    );
    this.selectedCountryCode = codeAndNumber?.countryCode;
    phoneNumber = codeAndNumber?.remainingNumber;

    phoneNumber = this.applyMask(phoneNumber);
    // Set the formatted value into the internal control
    this.internalControl.setValue(phoneNumber);
    this.internalControl.markAsTouched();
    this.updateExternalControl();

    // Return the formatted value
    return phoneNumber;
  }

  separateCodeAndNumber(
    phoneNumberWithCode: string,
    autoSelectCountryCode: boolean,
  ): { countryCode: CountryCode; remainingNumber: string } {
    const cleanNumber = phoneNumberWithCode.replace(/[^0-9]/g, '');
    const sortedCodes = [...this.countryCodes].sort(
      (a, b) => b.value.length - a.value.length,
    );

    if (autoSelectCountryCode) {
      //it will find which country codes matches with the input number
      for (const code of sortedCodes) {
        if (
          cleanNumber.startsWith(code.value) &&
          code.length <= cleanNumber.length - 1
        ) {
          const remainingNumber = cleanNumber.slice(code.value.length);
          return {
            countryCode: code,
            remainingNumber,
          };
        }
      }
    } else {
      //it will separate the already selected country code from the input number
      if (
        cleanNumber.startsWith(this.selectedCountryCode.value) &&
        this.selectedCountryCode.length <= cleanNumber.length
      ) {
        const remainingNumber = cleanNumber.slice(
          this.selectedCountryCode.value.length,
        );
        return {
          countryCode: this.selectedCountryCode,
          remainingNumber,
        };
      }
    }

    // Return number as-is if no match is found
    return {
      countryCode: this.selectedCountryCode,
      remainingNumber: cleanNumber,
    };
  }

  applyMask(phoneNumberWithoutCode: string): string {
    let rawValue = this.removeZero(phoneNumberWithoutCode.replace(/\D/g, '')); // Remove non-digits and leading zero
    let formattedValue = '';
    if (this.selectedCountryCode) {
      const mask = this.selectedCountryCode.mask;
      const maxDigits = (mask.match(/#/g) || []).length;
      rawValue = rawValue.substring(0, maxDigits); // Limit to max digits

      let numberIndex = 0;

      // Format the value according to the mask
      for (let i = 0; i < mask.length && numberIndex < rawValue.length; i++) {
        if (mask[i] === '#') {
          formattedValue += rawValue[numberIndex] || '_';
          numberIndex++;
        } else {
          formattedValue += mask[i];
        }
      }
    } else {
      formattedValue = phoneNumberWithoutCode;
    }

    return formattedValue;
  }

  moveCursor(
    cursorPos: number,
    originalValue: string,
    formattedValue: string,
  ): number {
    // If cursor is at the start, keep it at start
    if (cursorPos === 0) return 0;

    // If cursor is at the end, move to end of formatted value
    if (cursorPos === originalValue.length) {
      return formattedValue.length;
    }

    // Get the digits-only values
    const originalDigits = originalValue.replace(/\D/g, '');
    const formattedDigits = formattedValue.replace(/\D/g, '');

    // If no digits, return cursor position
    if (!originalDigits.length) return cursorPos;

    // Find the digit position in original value
    const originalValueUpToCursor = originalValue.slice(0, cursorPos);
    const digitsUpToCursor = originalValueUpToCursor.replace(/\D/g, '');
    const digitPosInOriginal = digitsUpToCursor.length;

    // Handle backspace/delete special cases
    if (originalDigits.length > formattedDigits.length) {
      // Find corresponding position in formatted value
      let count = 0;
      let pos = 0;

      for (
        let i = 0;
        i < formattedValue.length && count < digitPosInOriginal;
        i++
      ) {
        if (/\d/.test(formattedValue[i])) {
          count++;
        }
        pos = i;
      }

      return pos + 1;
    }

    // Handle regular input
    let digitCount = 0;
    let newPos = 0;

    // Find position in formatted value that corresponds to same digit count
    for (let i = 0; i < formattedValue.length; i++) {
      if (digitCount === digitPosInOriginal) {
        newPos = i;
        break;
      }

      if (/\d/.test(formattedValue[i])) {
        digitCount++;
      }

      newPos = i + 1;
    }

    return newPos;
  }
}