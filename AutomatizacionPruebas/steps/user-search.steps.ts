import { Given, When, Then } from '../fixtures/bdd';

function searchEmail(): string {
  const email = process.env.ADSEF_SEARCH_EMAIL?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Configurar ADSEF_SEARCH_EMAIL en .env con el correo de un usuario que exista en Búsqueda de usuarios.');
  }
  return email;
}

function searchSsn(): string {
  const ssn = process.env.ADSEF_SEARCH_SSN?.trim();
  if (!ssn || !/^\d{9}$/.test(ssn)) {
    throw new Error('Configurar ADSEF_SEARCH_SSN en .env con nueve dígitos, conservando ceros iniciales.');
  }
  return ssn;
}

function expectedUserId(): string {
  const userId = process.env.ADSEF_SEARCH_USER_ID?.trim();
  if (!userId) throw new Error('Configurar ADSEF_SEARCH_USER_ID con el Usuario ID esperado.');
  return userId;
}

Given('que hay un correo de usuario existente configurado para la búsqueda', async () => {
  searchEmail();
  expectedUserId();
});

Given('que hay un seguro social de usuario existente configurado para la búsqueda', async () => {
  searchSsn();
  expectedUserId();
});

When('abro la búsqueda de usuarios', async ({ userSearchPage }) => {
  await userSearchPage.openFromMenu();
});

When('busco el usuario existente por su correo electrónico', async ({ userSearchPage }) => {
  await userSearchPage.searchByEmail(searchEmail());
});

Then('se muestra el usuario correspondiente al correo buscado', async ({ userSearchPage }) => {
  await userSearchPage.expectUserResult(searchEmail(), expectedUserId());
});

When('busco el usuario existente por su seguro social', async ({ userSearchPage }) => {
  await userSearchPage.searchBySocialSecurityNumber(searchSsn());
});

Then('se muestra el usuario correspondiente al seguro social buscado', async ({ userSearchPage }) => {
  await userSearchPage.expectUserBySocialSecurityNumber(searchSsn(), expectedUserId());
});

When('busco un usuario con el correo {string}', async ({ userSearchPage }, email: string) => {
  await userSearchPage.searchByEmail(email);
});

Then('se muestra el aviso {string} sin resultados de usuarios', async ({ userSearchPage }, message: string) => {
  await userSearchPage.expectNoResults(message);
});
