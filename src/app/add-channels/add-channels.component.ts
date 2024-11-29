import { Component } from '@angular/core';
import { MailService } from 'src/services/mail.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-channels',
  templateUrl: './add-channels.component.html',
  styleUrls: ['./add-channels.component.scss']
})
export class AddChannelsComponent {
  accessToken: string | null = null;
  googleAcessToken: string  = "";
  googleRefreshToken: string = "";
  inboxName: string = "";
  code:  string | null = null;
  currentProvider :string =""
  constructor(private mailService: MailService,private route: ActivatedRoute) { 
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const { code, state } = params;
      
      if (code) {
        this.code = code
        if (state !== 'google') {
          // Handle regular access token request
          this.handleAccessToken(code);
        } else {
          // Handle Google-specific access token request
          this.handleGoogleAccessToken(code);
        }
      }
    });
  }
  
  private handleAccessToken(code: string): void {
    this.mailService.getToken(code).subscribe((response: any) => {
      console.log('Access Token:', response);
      this.currentProvider ="outlook";
      this.accessToken = response.access_token;
      this.clearQueryParams();
    });
  }
  
  private handleGoogleAccessToken(code: string): void {
    this.mailService.getGoogleAcessToken(code).subscribe((response: any) => {
      console.log('Google Access Token:', response);
      this.accessToken = response.access_token;
      this.googleRefreshToken = response.refresh_token;
      this.currentProvider ="google";
      this.clearQueryParams();
    });
  }
  
  private clearQueryParams(): void {
    // Clears the query parameters in the URL to avoid leaking sensitive data
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  

  signInOutlook() {
    this.mailService.authorizeOutlook();
  }

  saveInbox() {
    const inboxDetails = {
      "accessToken": this.accessToken,
      "inboxName": this.inboxName,
      "provider": this.currentProvider,
       "refreshToken" : this.currentProvider === "google" ? this.googleRefreshToken : ""
    }
    let inbox = JSON.parse(localStorage.getItem('Inbox') || '[]');

      inbox.push(inboxDetails);

    window.history.replaceState({}, document.title, window.location.pathname);
    this.code = null
      localStorage.setItem("Inbox", JSON.stringify(inbox));
  }


  signInGoogle(){
    window.open('https://accounts.google.com/o/oauth2/v2/auth?client_id=941875466092-0cogqttt4urb63em2p4ms5qh1bbhq1u9.apps.googleusercontent.com&redirect_uri=http://localhost:4200&response_type=code&scope=https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/gmail.readonly+https://www.googleapis.com/auth/gmail.send&access_type=offline&state=google&prompt=consent', '_self');
  }

}
