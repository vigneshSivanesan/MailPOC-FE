import { Component } from '@angular/core';
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
            // this.getGoogleInboxMails(this.accessToken);
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

  sanitizeHtml(html: string): SafeHtml {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.getElementsByTagName('img');
    while (images.length > 0) {
      images[0].parentNode?.removeChild(images[0]);
    }
    return this.sanitizer.bypassSecurityTrustHtml(tempDiv.innerHTML);
  }

  selectMail(mail: any): void {
    this.selectedMail = mail;
  }


}
