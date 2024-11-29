import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environment';
import { Observable, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MailService {

  private outlookClientId = environment.OUTLOOK_CLIENTID;
  private redirectUri = environment.REDIRECT_URI;
  private oauthUrl = environment.OAUTH_URL;
  private sendMailUrl = environment.SENDMAILURL;
  private graphUrl = environment.GRAPHURL;
  private googleAuthUrl = environment.GOOGLE_AUTH_URL;
  private gmailBaseUrl =  environment.GMAIL_BASE_URL;
  private googleSendMailUrl = environment.GOOGLESENDMAILURL; 
  private outlookSentMailUrl = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages';
  constructor(private http: HttpClient) { }


  async authorizeOutlook() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    localStorage.setItem('code_verifier', codeVerifier);

    const params = new HttpParams()
      .set('client_id', this.outlookClientId)
      .set('response_type', 'code')
      .set('redirect_uri', this.redirectUri)
      .set('scope', 'openid profile email Mail.ReadWrite Mail.Send')
      .set('state', '12345')
      .set('code_challenge', codeChallenge)
      .set('code_challenge_method', 'S256');

    const url = `${this.oauthUrl}?${params.toString()}`;
    window.location.href = url;
  }

  private generateCodeVerifier(): string {
    const array = new Uint32Array(56/2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
getToken(code: string) {
  const body = new URLSearchParams();
  body.set('client_id', this.outlookClientId);
  // body.set('client_secret', environment.OUTLOOK_SECRET);
  body.set('redirect_uri', this.redirectUri);
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  const codeVerifier = localStorage.getItem('code_verifier');
  if (codeVerifier) {
    body.set('code_verifier', codeVerifier);
  }
  return this.http.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
}

getInboxMails(accessToken: string) {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
  // const params = new HttpParams()
  // .set('$top', "5")
  // .set('$skip', "0");
  return this.http.get(this.graphUrl, { headers });
}



getOutlookSentMails(accessToken: string) {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
  // const params = new HttpParams()
  // .set('$top', "5")
  // .set('$skip', "0");
  // .set('$orderby', "sentDateTime desc")
  // .set('$select', 'subject,sender,sentDateTime');
  return this.http.get(this.outlookSentMailUrl, { headers });
}



sendMail(accessToken: string, email: any) {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });

  return this.http.post(this.sendMailUrl, email, { headers });
}

sendGmailMail(accessToken: string, rawEmail: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });

  const body = { raw: rawEmail };

  return this.http.post(this.googleSendMailUrl, body, { headers });
}


getGoogleAcessToken(code: string){

  const payoad = {
    code: code,
    client_id: environment.GOOGLE_CLIENTID,
    client_secret: environment.GOOGLE_CLIENT_SECRET,
    redirect_uri: environment.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  };
  

  return this.http.post(this.googleAuthUrl, payoad);
}

getGoogleInboxMails(accessToken: string) {
    const gmailBaseUrl = "https://www.googleapis.com/gmail/v1/users/me/messages"
  const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
  return this.http.get(gmailBaseUrl, { headers });
}



getGoogleSentMails(accessToken: string) {
  const gmailBaseUrl = "https://www.googleapis.com/gmail/v1/users/me/messages";
  const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
  const params = new HttpParams().set('labelIds', 'SENT'); // Filter by Sent Mail label

  return this.http.get(gmailBaseUrl, { headers, params });
}

// getGoogleSingleMail(accessToken: string, id: string) {
//   const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
//   return this.http.get(`${this.gmailBaseUrl}/${id}`, { headers });
// }

getGoogleMessage(accessToken: string, id: string): Observable<any> {
  const url = `${this.gmailBaseUrl}/${id}`;
  const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
  const params = new HttpParams().set('format', 'full'); // Get full message details
  return this.http.get(url, { headers, params });
}


getGoogleMessages(accessToken: string, ids: string[]): Observable<any[]> {
  const requests = ids.map(id => this.getGoogleMessage(accessToken, id));
  return forkJoin(requests);
}

}



