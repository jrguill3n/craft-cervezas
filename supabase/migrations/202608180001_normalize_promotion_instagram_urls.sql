begin;

update public.promotions
set instagram_url = regexp_replace(
  instagram_url,
  '^https://(www\.)?instagram\.com/p/([^/?#]+)/?.*$',
  'https://www.instagram.com/p/\2/',
  'i'
)
where instagram_url ~* '^https://(www\.)?instagram\.com/p/[^/?#]+';

commit;
