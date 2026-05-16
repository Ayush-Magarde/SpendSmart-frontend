import { environment } from '../../environments/environment';
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Category {
  id?: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  budgetLimit: number;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiBaseUrl}/api/categories`;
  
  // State using signals
  private categoriesSignal = signal<Category[]>([]);
  categories = this.categoriesSignal.asReadonly();

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.API_URL).pipe(
      tap(cats => this.categoriesSignal.set(cats))
    );
  }

  getCategoriesByType(type: 'INCOME' | 'EXPENSE'): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/type/${type}`).pipe(
      tap(cats => {
        // Update state but keep the other type's categories if already loaded
        const current = this.categoriesSignal();
        const otherType = current.filter(c => c.type !== type);
        this.categoriesSignal.set([...otherType, ...cats]);
      })
    );
  }

  createCategory(payload: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.API_URL, payload).pipe(
      tap(newCat => {
        this.categoriesSignal.update(prev => [...prev, newCat]);
      })
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { responseType: 'text' });
  }

  // Helper to get categories from local state
  getCachedByType(type: 'INCOME' | 'EXPENSE') {
    return this.categoriesSignal().filter(c => c.type === type);
  }
}


