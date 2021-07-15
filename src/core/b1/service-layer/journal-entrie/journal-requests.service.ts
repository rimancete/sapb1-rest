import { Injectable } from '@nestjs/common';
import { ODataService } from '../odata/odata.service'
import { Document } from './interfaces';

@Injectable()
export class JournalEntriesRequestsService extends ODataService<Document> {

  constructor() {
    super();
    this.path = "JournalEntries";
  }
  
}
