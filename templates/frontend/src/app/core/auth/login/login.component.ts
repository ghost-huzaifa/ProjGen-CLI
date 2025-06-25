import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhoneNumberComponent } from '../../../shared/components/phone-number/phone-number.component';
import { EmailLoginForm, PhoneNumberLoginForm } from '../auth.type';
import { emailLoginForm, phoneNumberLoginForm } from '../auth.model';
import { LoginPayload } from 'src/app/shared/models/auth.model';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
enum TEST_LOGIN_USER {
  SUPER_ADMIN,
  DOCTOR,
  NURSE,
  RECEPTIONIST,
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PhoneNumberComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  emailLoginForm!: FormGroup<EmailLoginForm>;
  phoneNumberLoginForm!: FormGroup<PhoneNumberLoginForm>;
  loading = false;
  submitted = false;
  hidePassword = true;
  returnUrl: string = '/dashboard/schedule';
  loginError: string | null = null;
  date = new Date();
  isEmailType = true;
  TEST_LOGIN_USER = TEST_LOGIN_USER;

  buildTime: string | null = null;
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private injector: Injector,
    private http: HttpClient
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard/schedule']);
    }
    this.emailLoginForm = this.formBuilder.group(emailLoginForm);
    this.phoneNumberLoginForm = this.formBuilder.group(phoneNumberLoginForm);
  }

  ngOnInit(): void {
    this.http.get<{ buildTime: string }>('/assets/build-info.json').subscribe({
      next: (data) => (this.buildTime = data.buildTime),
      error: () => (this.buildTime = null),
    });

    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard/schedule';

    // Clear error when user starts typing
    this.emailLoginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
      }
    });

    this.phoneNumberLoginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
      }
    });
  }

  get f() {
    return this.isEmailType
      ? this.emailLoginForm.controls
      : this.phoneNumberLoginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.loginError = null;

    const activeForm = this.isEmailType
      ? this.emailLoginForm
      : this.phoneNumberLoginForm;
    if (activeForm.invalid) {
      return;
    }

    const payload = this.isEmailType
      ? this.authService.createLoginPayload(
          this.isEmailType,
          this.f['email'].value,
          this.f['password'].value
        )
      : this.authService.createLoginPayload(
          this.isEmailType,
          this.f['phoneNumber'].value,
          this.f['password'].value
        );

    this.login(payload);
  }

  testLogin(user: TEST_LOGIN_USER): void {
    let email: string;
    let password: string;

    switch (user) {
      case TEST_LOGIN_USER.SUPER_ADMIN:
        email = 'superadmin@clinic.com';
        password = 'superadmin123';
        break;
      case TEST_LOGIN_USER.DOCTOR:
        email = 'dr.smith@clinic.com';
        password = 'doctor123';
        break;
      case TEST_LOGIN_USER.NURSE:
        email = 'nurse.johnson@clinic.com';
        password = 'nurse123';
        break;
      case TEST_LOGIN_USER.RECEPTIONIST:
        email = 'receptionist@clinic.com';
        password = 'reception123';
        break;
      default:
        email = 'receptionist@clinic.com';
        password = 'reception123';
    }

    const payload = this.authService.createLoginPayload(true, email, password);
    this.login(payload);
  }

  toggleLoginType(loginType: boolean): void {
    this.isEmailType = loginType;
    this.emailLoginForm.reset();
    this.phoneNumberLoginForm.reset();
    this.loginError = null;
  }

  login(payload: LoginPayload) {
    this.loading = true;
    this.loginError = null;

    // this.webSocketService.sendRequest(socketKeys.test, payload, this.navigateToDashboard.bind(this))
    this.authService.login(payload).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          this.loginError = 'Invalid credentials, Try Again';
        } else {
          // For other errors (500, etc), show in snackbar
          this.callSnackBar(error);
        }
      },
    });
  }

  private navigateToDashboard() {
    this.router.navigate([this.returnUrl]);
  }

  private async callSnackBar(error: any) {
    try {
      const matSnackBarModule = await import('@angular/material/snack-bar');
      const snackBar = this.injector.get(matSnackBarModule.MatSnackBar);
      const errorMessage =
        error?.message || 'An error occurred. Please try again.';

      snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar'],
      });
    } catch (err) {
      console.error('Error loading snackbar:', err);
    }
  }
}
