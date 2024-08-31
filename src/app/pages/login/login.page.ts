import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { ItemService } from '../../services/item.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(public navCtrl: NavController,
    public alertController: AlertController,
    private itemService: ItemService,
    private storage: Storage) {

  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    //fetch saved email
    // this.storage.create();
    this.storage.get('savedEmail').then((data) => {
      this.userName = data;
      console.log(this.userName)
    });
  }

  userName: any;
  password: any;

  loginData: any;

  loginCheck() {
    if (this.userName == null || this.userName == null) {
      this.presentAlert("Warning!", "All fields are mandatory.");
    }
    else {
      this.itemService.loginCheck(this.userName, this.password).then(data => {
        console.log(data);
        this.loginData = data;
        console.log("status: " + this.loginData.status)
        if (this.loginData.status) {
          console.log("login success");
          this.saveEmailToLocalStorage(this.userName);
          this.navCtrl.navigateRoot('/control'); //success
        }
        else {
          //assign value from left join. Run join query here
          this.presentAlert("Login Failed", this.loginData.message);
        }
      }).catch((error) => {
        this.presentAlert("Error", "No Internet connection");
      });
    }
  }

  async presentAlert(headerMsg, msg) {
    const alert = await this.alertController.create({
      header: headerMsg,
      message: msg,
      backdropDismiss: false,
      buttons: ['OK']
    });

    await alert.present();
  }

  //save email to localstorage
  saveEmailToLocalStorage(email) {
    this.storage.set("savedEmail", email).then(result => {
      // this.presentToastForCount('Added to Favorite');
    }).catch(e => {
      // this.presentToastForCount('Sorry! Something went wrong. Please contact developer');
    });
  }

}
