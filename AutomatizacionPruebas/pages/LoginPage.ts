import { expect, type Locator, type Page } from '@playwright/test';

/** Localizadores contrastados con el HTML real del login de ADSEF. */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly accessButton: Locator;
  readonly usernameValidation: Locator;
  readonly errorMessage: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByRole('textbox', { name: 'Nombre de Usuario', exact: true });
    this.password = page.getByLabel('Contraseña', { exact: true });
    this.accessButton = page.getByRole('button', { name: 'Accesar', exact: true });
    this.usernameValidation = page.locator('#mainCopy_valueUsuarioRegex');
    this.errorMessage = page.locator('#mainCopy_lblErrorMessage');
  }

  async goto() {
    const response = await this.page.goto('Security/Login.aspx', { waitUntil: 'domcontentloaded' });
    expect(response, 'El login debe responder por HTTP').not.toBeNull();
    expect(response!.status(), 'El login debe responder HTTP 200').toBe(200);
    await this.expectReady();
  }

  async expectReady() {
    await expect(this.page).toHaveTitle(/Bienvenidos ADSEF Digital/);
    await expect(this.username).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.accessButton).toBeEnabled();
  }

  async fillCredentials(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async dismissBenefitsNotice() {
    const notice = this.page.locator('#messagesLogin');
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Continuar con ADSEF Digital', exact: true }).click();
    await expect(notice).toBeHidden();
  }

  async submit() {
    await this.accessButton.click();
  }

  async login(username: string, password: string) {
    await this.fillCredentials(username, password);
    await this.submit();
  }

  async expectAuthenticated() {
    await expect(
      this.page,
      'El acceso debe abandonar Login.aspx; permanecer en el formulario no es un login exitoso'
    ).not.toHaveURL(/\/Security\/Login\.aspx(?:[?#]|$)/i, { timeout: 20_000 });

    const expectedURL = process.env.ADSEF_AUTHENTICATED_URL;
    const authenticatedSelector = process.env.ADSEF_AUTHENTICATED_SELECTOR;
    if (!expectedURL?.trim() || !authenticatedSelector?.trim()) {
      throw new Error('Se abandonó el login, pero falta confirmar la pantalla autenticada: configurar ADSEF_AUTHENTICATED_URL y ADSEF_AUTHENTICATED_SELECTOR en .env con el destino real.');
    }
    await expect(this.page).toHaveURL(expectedURL);
    await expect(this.page.locator(authenticatedSelector)).toBeVisible();
    await expect(this.accessButton).toBeHidden();
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage, 'Debe mostrarse el error de credenciales').toBeVisible();
    await expect(this.errorMessage, 'El mensaje debe coincidir con el rechazo esperado').toHaveText(message);
    await expect(this.page).toHaveURL(/\/Security\/Login\.aspx(?:[?#]|$)/i);
    await expect(this.accessButton).toBeVisible();
  }
}
