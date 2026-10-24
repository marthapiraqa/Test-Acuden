import { expect, type Locator, type Page } from '@playwright/test';

export class UserSearchPage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly noRecords: Locator;

  constructor(readonly page: Page) {
    this.searchInput = page.locator('#mainCopy_txtBuscar');
    this.searchButton = page.getByRole('button', { name: 'Buscar', exact: true });
    this.noRecords = page.locator('#mainCopy_pnlNoRecords');
  }

  async openFromMenu() {
    await this.page.locator('#mainCopy_imbtBusquedaUsuarios').click();
    await expect(this.page).toHaveURL(/\/Security\/OperadorBusquedaUsuarios\.aspx(?:[?#]|$)/i);
    await expect(this.searchInput).toBeEditable();
    await expect(this.searchButton).toBeEnabled();
  }

  async searchByEmail(email: string) {
    await this.search(email);
  }

  async searchBySocialSecurityNumber(ssn: string) {
    // Mantener como texto: un SSN puede empezar por cero.
    await this.search(ssn);
  }

  private async search(value: string) {
    await this.searchInput.fill(value);
    const [response] = await Promise.all([
      this.page.waitForResponse(response =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/Security/OperadorBusquedaUsuarios.aspx')
      ),
      this.searchButton.click()
    ]);
    expect(response.ok(), 'La consulta de usuarios debe responder sin error HTTP').toBeTruthy();
    await response.finished();
  }

  async expectUserResult(email: string, userId: string) {
    const row = await this.expectUserRow(userId);
    await expect(row.locator('td').nth(2), 'La fila del usuario debe mostrar el correo buscado').toHaveText(email);
  }

  async expectUserBySocialSecurityNumber(ssn: string, userId: string) {
    const row = await this.expectUserRow(userId);
    await expect(row.locator('td').nth(3), 'La fila del usuario debe mostrar el seguro social buscado').toHaveText(ssn);
  }

  async expectNoResults(message: string) {
    await expect(this.noRecords, 'Debe mostrarse el aviso de búsqueda sin resultados').toBeVisible();
    await expect(this.noRecords).toHaveText(message);
    const results = this.page.getByRole('table').filter({
      has: this.page.getByText('Usuario ID', { exact: true })
    });
    await expect(results.locator('tr:has(td)'), 'No deben quedar filas de usuarios en los resultados').toHaveCount(0);
    await expect(this.page).toHaveURL(/\/Security\/OperadorBusquedaUsuarios\.aspx(?:[?#]|$)/i);
    await expect(this.searchInput).toBeEditable();
  }

  private async expectUserRow(userId: string): Promise<Locator> {
    await expect(this.noRecords, 'No debe mostrarse el aviso de búsqueda sin resultados').toBeHidden();
    // Columnas observadas en la captura: Usuario ID, Usuario, Correo electrónico,
    // Seguro Social, Activo. Un correo puede pertenecer a varias filas.
    const results = this.page.getByRole('table').filter({
      has: this.page.getByText('Usuario ID', { exact: true })
    });
    await expect(results, 'Debe mostrarse la tabla de usuarios').toHaveCount(1);
    await expect(results).toBeVisible();
    const escapedId = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = results.getByRole('row').filter({
      has: this.page.locator('td:first-child', { hasText: new RegExp(`^\\s*${escapedId}\\s*$`) })
    });
    await expect(row, 'Debe existir una fila con el Usuario ID esperado').toHaveCount(1);
    await expect(row.locator('td').nth(0)).toHaveText(userId);
    await expect(this.page).toHaveURL(/\/Security\/OperadorBusquedaUsuarios\.aspx(?:[?#]|$)/i);
    return row;
  }
}
