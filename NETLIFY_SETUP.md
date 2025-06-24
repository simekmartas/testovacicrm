# 🔐 Nastavení GitHub Tokenu v Netlify

## Krok 1: Přihlaste se do Netlify
1. Jděte na https://app.netlify.com
2. Přihlaste se ke svému účtu
3. Vyberte váš CRM projekt

## Krok 2: Nastavení Environment Variables
1. Klikněte na **"Site settings"** (Nastavení stránky)
2. V levém menu najděte **"Environment variables"**
3. Klikněte na **"Add a variable"** (Přidat proměnnou)
4. Vyplňte:
   - **Key**: `GITHUB_TOKEN`
   - **Values**: Váš GitHub Personal Access Token
   - **Scopes**: Nechte "All scopes"
5. Klikněte **"Create variable"**

## Krok 3: Deploy aplikace
1. Jděte do **"Deploys"** (Nasazení)
2. Klikněte **"Trigger deploy"** → **"Deploy site"**
3. Počkejte na dokončení (2-5 minut)

## ⚠️ DŮLEŽITÉ BEZPEČNOSTNÍ UPOZORNĚNÍ

1. **NIKDY** nesdílejte váš GitHub token
2. **NIKDY** ho neukládejte přímo v kódu
3. Token funguje pouze přes Netlify environment variables
4. Po dokončení projektu můžete token smazat na GitHubu

## 🧪 Testování

Po nasazení:
1. Otevřete váš web
2. Přihlaste se
3. Vytvořte nebo upravte klienta
4. Zkontrolujte váš GitHub repozitář "crmdata" - měly by se tam objevit soubory

## 🔧 Řešení problémů

Pokud synchronizace nefunguje:
1. Zkontrolujte, že je token správně nastaven v Netlify
2. Ujistěte se, že má token oprávnění "repo"
3. Zkontrolujte konzoli prohlížeče (F12) pro chybové hlášky

## 📝 Poznámka

Aplikace funguje i bez GitHub tokenu - data se pak ukládají pouze lokálně v prohlížeči. 