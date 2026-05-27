<template>
  <div class="site">
    <SiteHeader />
    <main class="site__main">
      <slot />
    </main>
    <SiteFooter />
    <CookieBanner />
  </div>
</template>
