import * as _ from 'lodash';

export interface MaterialRevaluation {
  DocEntry?: string,
  Comments?: string,
  DocDate?: string,
  DataSource?: string,
  MaterialRevaluationLines?: Lines[],
  RevalType?: string

}

export interface Lines {
  ItemCode: string,
  Price: string
}

