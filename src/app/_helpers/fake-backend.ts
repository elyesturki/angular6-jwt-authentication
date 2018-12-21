import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

    constructor() { }

    utf8_to_b64(str: any) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    b64_to_utf8(str: any) {
      return decodeURIComponent(escape(window.atob( str )));
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let testUser = { 
            id: 1, 
            username: 'admin', 
            password: 'admin', 
            firstName: 'Elyes', 
            lastName: 'Turki' , 
            userKey : 'eyJhbGciOiJub25lIiwidHlwIjoiSldU',
            domaine: 'http://localhost:4000'
        }
        let apikey = '';
        console.log("request-f: ",request)
        // wrap in delayed observable to simulate server api call
        return of(null).pipe(mergeMap(() => {
            // authenticate
            if (request.url.endsWith('/users/authenticate') && request.method === 'POST') {
                apikey = this.utf8_to_b64(testUser.username + testUser.password + testUser.userKey + testUser.domaine);
                if (request.body.username === this.utf8_to_b64(testUser.username) && 
                    request.body.password === this.utf8_to_b64(testUser.password) && 
                    request.body.apikey === apikey) {
                    // if login details are valid return 200 OK with a fake jwt token
                    let body = {
                        id: testUser.id,
                        username: testUser.username,
                        firstName: testUser.firstName,
                        lastName: testUser.lastName,
                        token: 'fake-jwt-token'
                    };
                    return of(new HttpResponse({ status: 200, body }));
                } else {
                    // else return 400 bad request
                    return throwError({ error: { message: 'Username or password is incorrect' } });
                }
            }

            // get users
            if (request.url.endsWith('/users') && request.method === 'GET') {
                console.log("ffff: ",request.headers.get('Authorization'))
                // check for fake auth token in header and return users if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    return of(new HttpResponse({ status: 200, body: [testUser] }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ error: { message: 'Unauthorised' } });
                }
            }

            // pass through any requests not handled above
            return next.handle(request);
            
        }))

        // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
        .pipe(materialize())
        .pipe(delay(500))
        .pipe(dematerialize());
    }
}

export let fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};