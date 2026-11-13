# Private media (Hostinger / local disk)

Do **not** put member-only files in `public/`.

Place large archives here, for example:

```
private-media/freemasons-without-borders/archives/FWB_Consecration.rar
```

The download API reads from `PRIVATE_MEDIA_ROOT` (defaults to this folder) after membership check.
