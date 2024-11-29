import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MailChannelComponent } from './mail-channel/mail-channel.component';
import { AddChannelsComponent } from './add-channels/add-channels.component';
import { MailBoxComponent } from './mail-box/mail-box.component';


const routes: Routes = [
  { path: '', component: AddChannelsComponent },
  { path: 'MailBox', component: MailBoxComponent },
  { path: 'Channels', component: AddChannelsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
