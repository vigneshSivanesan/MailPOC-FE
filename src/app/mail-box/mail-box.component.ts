import { Component } from '@angular/core';

@Component({
  selector: 'app-mail-box',
  templateUrl: './mail-box.component.html',
  styleUrls: ['./mail-box.component.scss']
})


export class MailBoxComponent {
  selectedTab: string  = "Inbox";

  constructor() {}
  


  ngOnInit(): void { 

  }
  setSelectedTab (value:string) {
    this.selectedTab = value; 
  }

}
