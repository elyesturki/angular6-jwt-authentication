import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../_services';

@Component({templateUrl: 'login.component.html'})
export class LoginComponent implements OnInit {

    userKey = 'eyJhbGciOiJub25lIiwidHlwIjoiSldU';
    domaine = config.apiUrl;

    loginForm: FormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;
    error = '';

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService) {}

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        // reset login status
        this.authenticationService.logout();

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        //////

        // Usage:
            //console.log(this.utf8_to_b64('admin'+'admin')); // "4pyTIMOgIGxhIG1vZGU="
            //console.log(this.b64_to_utf8('4pyTIMOgIGxhIG1vZGU=')); // "✓ à la mode"


    }

    utf8_to_b64(str: any) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    b64_to_utf8(str: any) {
      return decodeURIComponent(escape(window.atob( str )));
    }



    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        let apiKey = this.utf8_to_b64(this.f.username.value + this.f.password.value + this.userKey + this.domaine);
        console.log(apiKey);

        this.loading = true;
        this.authenticationService.login(this.utf8_to_b64(this.f.username.value), this.utf8_to_b64(this.f.password.value) , apiKey )
            .pipe(first())
            .subscribe(
                data => {
                    this.router.navigate([this.returnUrl]);
                },
                error => {
                    this.error = error;
                    this.loading = false;
                });
    }
}
