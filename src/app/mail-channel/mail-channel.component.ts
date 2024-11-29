import { Component, SecurityContext } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MailService } from 'src/services/mail.service';

@Component({
  selector: 'app-mail-channel',
  templateUrl: './mail-channel.component.html',
  styleUrls: ['./mail-channel.component.scss']
})
export class MailChannelComponent {

  selectedInbox: any = {};
  email: string  = "";
  mails: any[] = [];
  accessToken: string | null = null;
  selectedMail: any = null;
  showComposePopup: boolean = false;
  composeForm: FormGroup = new FormGroup({});
  inboxData: any;
  constructor(private mailService: MailService,  private fb: FormBuilder,private route: ActivatedRoute,  private sanitizer: DomSanitizer) { 
    this.generateComposeForm()
  }


  ngOnInit(): void {
    // this.route.queryParams.subscribe(params => {
    //   const code = params['code'];
    //   if (code) {
    //     this.mailService.getToken(code).subscribe((response: any) => {
    //       console.log('Access Token:', response);
    //       this.accessToken = response.access_token;
    //       if (this.accessToken) {
    //         localStorage.setItem('accessToken', this.accessToken);
    //         this.getInboxMails(this.accessToken);
    //         window.history.replaceState({}, document.title, window.location.pathname);
    //       }
    //     });
    //   } else {
    //     this.accessToken = localStorage.getItem('accessToken');
    //     if (this.accessToken) {
    //       this.getInboxMails(this.accessToken);
    //     }
    //   }
    // });
    this.inboxData = JSON.parse(localStorage.getItem('Inbox') || '[]');
  }

  selectInbox(inbox: any) {
    this.selectedInbox = inbox;
    this.accessToken = inbox.accessToken
        if (this.accessToken) {
          if(inbox.provider === 'outlook'){
            this.getInboxMails(this.accessToken);
          }else if(inbox.provider==='google'){
            this.getGoogleInboxMails(this.accessToken);
          }
      
        }
  }

  generateComposeForm() {
    this.composeForm = this.fb.group({
      to: [''],
      subject: [''],
      body: ['']
    });
  }

  getGoogleInboxMails(accessToken: string): void {
    this.mailService.getGoogleInboxMails(accessToken).subscribe(
      (response: any) => {
        const messageIds = response.messages.map((msg: any) => msg.id);
  
        const idsToFetch = messageIds.slice(0, 10); // Fetch the first 10 messages
  
        this.mailService.getGoogleMessages(accessToken, idsToFetch).subscribe(
          (messages: any[]) => {
            const mailList = messages.map((msg: any) => {
              // Extract headers
              const headers = msg.payload.headers;
              const subjectHeader = headers.find((header: any) => header.name.toLowerCase() === 'subject');
              const subject = subjectHeader ? subjectHeader.value : 'No Subject';
  
              const fromHeader = headers.find((header: any) => header.name.toLowerCase() === 'from');
              let fromName = '';
              let fromEmail = '';
              if (fromHeader) {
                const fromValue = fromHeader.value;
                const match = fromValue.match(/(.*)<(.*)>/);
                if (match) {
                  fromName = match[1].trim();
                  fromEmail = match[2].trim();
                } else {
                  fromEmail = fromValue;
                }
              }
  
              const dateHeader = headers.find((header: any) => header.name.toLowerCase() === 'date');
              const sentDateTime = dateHeader ? new Date(dateHeader.value).toISOString() : '';
  
              // Extract body content
              let bodyData = '';
              if (msg.payload.parts) {
                const htmlPart = msg.payload.parts.find((part: any) => part.mimeType === 'text/html');
                bodyData = htmlPart ? htmlPart.body.data : '';
                if (!bodyData) {
                  const plainPart = msg.payload.parts.find((part: any) => part.mimeType === 'text/plain');
                  bodyData = plainPart ? plainPart.body.data : '';
                }
              } else {
                bodyData = msg.payload.body.data;
              }
              const decodedBody = bodyData ? atob(bodyData.replace(/-/g, '+').replace(/_/g, '/')) : '';
  
              // Format the message object to match Outlook format
              return {
                subject: subject,
                sentDateTime: sentDateTime,
                from: {
                  emailAddress: {
                    name: fromName,
                    address: fromEmail
                  }
                },
                body: {
                  content: this.sanitizeHtml(decodedBody)
                }
              };
            });
            this.mails = mailList;
            if (this.mails.length > 0) {
              this.selectedMail = this.mails[0];
              console.log('Selected mail:', this.selectedMail);
            }
          },
          error => {
            console.error('Error fetching message details:', error);
          }
        );
      },
      error => {
        console.error('Error fetching inbox mails:', error);
      }
    );
  }
  // getGoogleSingleMail(accessToken: string, id :string): void {
  //   this.mailService.getGoogleSingleMail(accessToken, id).subscribe((mails: any) => {
  //     console.log('Inbox Mails:', mails);
  //   }, error => {
  //     console.error('Error fetching inbox mails:', error);
  
  //   });
  // }
  
  getInboxMails(accessToken: string): void {
    this.mailService.getInboxMails(accessToken).subscribe((mails: any) => {
      this.mails = mails.value;
      this.selectedMail = this.mails[0];
      console.log('Inbox Mails:', this.mails);
    }, error => {
      console.error('Error fetching inbox mails:', error);
      this.signInOutlook();
    });
  }
  

  

  selectMail(mail: any): void {
    this.selectedMail = mail;
  }

  signInOutlook() {
    this.mailService.authorizeOutlook();

  }

  sanitizeHtml(html: string): SafeHtml {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.getElementsByTagName('img');
    while (images.length > 0) {
      images[0].parentNode?.removeChild(images[0]);
    }
    return this.sanitizer.sanitize(SecurityContext.HTML,tempDiv.innerHTML) || '';
  }

  openComposePopup(): void {
    this.composeForm.patchValue({
      to: this.selectedMail.from.emailAddress.address,
      subject: `Re: ${this.selectedMail.subject}`,
      body: ``
    });
    this.showComposePopup = true;
  }

  closeComposePopup(): void {
    this.showComposePopup = false;
  }

  sendMail(): void {
    if (this.accessToken) {
      if(this.selectedInbox.provider === 'outlook') {
        this.outlookSendEmail(this.composeForm.value);
      } else {
        this.gmailSendEmail(this.composeForm.value);
      }
    }
  }

  gmailSendEmail(data: any): void {
    if (this.accessToken) {
      const rawEmail = this.makeGmailRawEmail(data);
      this.mailService.sendGmailMail(this.accessToken, rawEmail).subscribe(
        response => {
          console.log('Gmail sent successfully:', response);
          this.closeComposePopup();
        },
        error => {
          console.error('Error sending Gmail:', error);
        }
      );
    }
  }

  private makeGmailRawEmail(email: any): string {
    const subject = email.subject;
    const to = Array.isArray(email.to) ? email.to.join(',') : email.to;
    const body = email.body;

    const rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      `${body}`
    ].join('\n');

    return this.base64UrlEncode(rawEmail);
  }

  private base64UrlEncode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }


  outlookSendEmail(data:any) {
    if(this.accessToken) {
      const composeMail = data;
      const email = {
        message: {
          subject: composeMail.subject,
          body: {
            contentType: 'Text',
            content: composeMail.body
          },
          toRecipients: [
            {
              emailAddress: {
                address: composeMail.to
              }
            }
          ]
        },
        saveToSentItems: 'true'
      };
    this.mailService.sendMail(this.accessToken, email).subscribe(response => {
      console.log('Mail sent successfully:', response);
      this.closeComposePopup();
    }, error => {
      console.error('Error sending mail:', error);
    });
  }
}
}
