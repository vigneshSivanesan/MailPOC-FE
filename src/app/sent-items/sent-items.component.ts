import { Component, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MailService } from 'src/services/mail.service';

@Component({
  selector: 'app-sent-items',
  templateUrl: './sent-items.component.html',
  styleUrls: ['./sent-items.component.scss']
})
export class SentItemsComponent {
  selectedInbox: any = {};
  email: string  = "";
  mails: any[] = [];
  accessToken: string | null = null;
  selectedMail: any = null;
  showComposePopup: boolean = false;
  inboxData: any;
  constructor(private mailService: MailService,private route: ActivatedRoute,  private sanitizer: DomSanitizer) { 
  
  }


  ngOnInit(): void {
 
    this.inboxData = JSON.parse(localStorage.getItem('Inbox') || '[]');
  }

  selectInbox(inbox: any) {
    this.selectedInbox = inbox;
    this.accessToken = inbox.accessToken
        if (this.accessToken) {
          if(inbox.provider === 'outlook'){
            this.getOutlookSentMails(this.accessToken);
          }else if(inbox.provider==='google'){
             this.getGoogleSentMails(this.accessToken);
          }
      
        }
  }

    
  getOutlookSentMails(accessToken: string): void {
    this.mailService.getOutlookSentMails(accessToken).subscribe((mails: any) => {
      this.mails = mails.value;
      this.selectedMail = this.mails[0];
      console.log('Inbox Mails:', this.mails);
    }, error => {
      console.error('Error fetching inbox mails:', error);
      // this.signInOutlook();
    });
  }


  getGoogleSentMails(accessToken: string): void {
    this.mailService.getGoogleSentMails(accessToken).subscribe(
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

  // getGmailSentMails(accessToken: string): void {
  //   this.mailService.getGoogleSentMails(accessToken).subscribe((mails: any) => {
  //     this.mails = mails.value;
  //     this.selectedMail = this.mails[0];
  //     console.log('Inbox Mails:', this.mails);
  //   }, error => {
  //     console.error('Error fetching inbox mails:', error);
  //     // this.signInOutlook();
  //   });
  // }

  sanitizeHtml(html: string): SafeHtml {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.getElementsByTagName('img');
    while (images.length > 0) {
      images[0].parentNode?.removeChild(images[0]);
    }
    return this.sanitizer.sanitize(SecurityContext.HTML,tempDiv.innerHTML) || '';
  }

  selectMail(mail: any): void {
    this.selectedMail = mail;
  }


}
