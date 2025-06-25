import { FormControl, Validators } from "@angular/forms";
import { EmailLoginForm, PhoneNumberLoginForm } from "./auth.type";

export const emailLoginForm: EmailLoginForm = {
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    password: new FormControl<string | null>('', [Validators.required, Validators.minLength(8)]),
    // rememberMe: new FormControl<boolean | null>(false, []),
}

export const phoneNumberLoginForm: PhoneNumberLoginForm = {
    phoneNumber: new FormControl<string | null>('', [Validators.required]),
    password: new FormControl<string | null>('', [Validators.required, Validators.minLength(8) ]),
    // rememberMe: new FormControl<boolean | null>(false, []),
}
