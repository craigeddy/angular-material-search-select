import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';
import { NorthwindODataConfigurationFactory } from '../NorthwindODataConfigurationFactory';
import { ODataConfiguration, ODataServiceFactory, ODataService, ODataQuery, ODataPagedResult } from 'angular-odata-es5';

import { OptionEntry } from '../obs-autocomplete/';

// https://github.com/StefH/angular-odata-es5
// https://northwinddatabase.codeplex.com/

export interface IEmployee {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  City: string;
  BirthDate: Date;
}

@Component({
  selector: 'obs-demo-3-real-api',
  templateUrl: './demo-3-real-api.component.html',
  providers: [{
    provide: ODataConfiguration,
    useFactory: NorthwindODataConfigurationFactory
  }, ODataServiceFactory],
  styles: []
})
export class Demo3RealApiComponent {
  ours = new FormControl(null, [Validators.required]);
  valueToDisplay1 = this.valueToDisplay.bind(this);
  searchFn1 = this.searchFn.bind(this);
  private odata: ODataService<IEmployee>;

  constructor(odataFactory: ODataServiceFactory) {
    this.odata = odataFactory.CreateService<IEmployee>('Employees');
  }

  valueToDisplay(value: any): Observable<OptionEntry | null> {
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }
    if (typeof value !== 'number') {
      return of(null);
    }

    const query: ODataQuery<IEmployee> = this.odata
      .Query()
      .Select(['EmployeeID', 'FirstName', 'LastName', 'BirthDate', 'City'])
      .Filter(`EmployeeID eq ${value}`);

    return query
      .Exec()
      .pipe(map((emps: IEmployee[]) => {
        if (emps.length === 0) {
          return null;
        }
        return ({
          value: emps[0].EmployeeID,
          display: emps[0].FirstName + ' ' + emps[0].LastName,
          match: true
        });
      }));
  }

  searchFn(term: string): Observable<OptionEntry[]> {
    term = term || '';

    let query: ODataQuery<IEmployee> = this.odata
      .Query()
      .Select(['EmployeeID', 'FirstName', 'LastName', 'BirthDate', 'City'])
      .Top(200)
      .OrderBy('LastName asc');

    if (term !== '') {
      const criteria = [];
      criteria.push(`contains(LastName, '${term}')`);
      criteria.push(`contains(FirstName, '${term}')`);
      query = query.Filter(criteria.join(' or '));
    }

    return query
      .ExecWithCount()
      .pipe(map((pagedResult: ODataPagedResult<IEmployee>) =>
        pagedResult.data.map(emp => ({
          value: emp.EmployeeID,
          display: emp.FirstName + ' ' + emp.LastName,
          match: (emp.FirstName + ' ' + emp.LastName) === term
        }))));
  }
}
