import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MailChannelComponent } from './mail-channel/mail-channel.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AddChannelsComponent } from './add-channels/add-channels.component';
import { SentItemsComponent } from './sent-items/sent-items.component';
import { MailBoxComponent } from './mail-box/mail-box.component';

@NgModule({
  declarations: [
    AppComponent,
    MailChannelComponent,
    SidebarComponent,
    AddChannelsComponent,
    SentItemsComponent,
    MailBoxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
