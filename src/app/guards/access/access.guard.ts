import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

interface Submodule {
  MENUID: number;
  MODULECODE: number;
  MODULESHORTNAME: string;
  MODULENAME: string;
  MODULEURL: string;
}

interface Module {
  MODULEDISPLAYNAME: string;
  MODULEICON: string;
  MODULEURL: string;
  SUBMODULES: Submodule[];
}

@Injectable({
  providedIn: 'root'
})
export class AccessGuard implements CanActivate {
  moduleList: Module[] = [];

  constructor(private router: Router) {
    // Load the module list from localStorage or a service
    const storedModules = localStorage.getItem('moduleList');
    if (storedModules) {
      this.moduleList = JSON.parse(storedModules) as Module[]; // Explicitly cast to Module[]
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requestedRoute = state.url.split('/')[1]; // Extract the first segment of the URL

    // Convert spaces to dashes and ensure lowercase for comparison
    const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

    // Check if the requested route exists in moduleList or submodules
    const hasAccess = this.moduleList.some((module: Module) => {
      const moduleName = normalizeName(module.MODULEURL);

      // Check if the route matches a module name
      if (moduleName === requestedRoute) return true;

      // Check if the route matches any submodule name
      return module.SUBMODULES.some((submodule: Submodule) => normalizeName(submodule.MODULEURL) === requestedRoute);
    });

    if (!hasAccess) {
      // Redirect to the dashboard if access is denied
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
