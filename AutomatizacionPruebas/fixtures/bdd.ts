import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { UserSearchPage } from '../pages/UserSearchPage';

export const test = base.extend<{ loginPage: LoginPage; userSearchPage: UserSearchPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  userSearchPage: async ({ page }, use) => {
    await use(new UserSearchPage(page));
  }
});

export const { Given, When, Then } = createBdd(test);
