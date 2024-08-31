import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { NavController } from '@ionic/angular';
import { Storage} from '@ionic/storage-angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  items: Array<any>;

  fetchedConfigData: any;

  constructor(
    private router: Router,
    public itemService: ItemService,
    public navCtrl: NavController,
    private storage: Storage
  ){}

  ngOnInit(){
    // this.items = this.itemService.getItems();
  }

  ionViewDidEnter(){
    this.getDataFromLocalstorage();
  }

  getDataFromLocalstorage(){
    this.storage.get('keyOfData').then((data) => {
      this.fetchedConfigData = data;
      if (!this.fetchedConfigData) {
        console.log("navigate to setting page")
        this.navCtrl.navigateRoot('/setting'); //navigate to setting page if no config file
      } 
    });
  }

}
