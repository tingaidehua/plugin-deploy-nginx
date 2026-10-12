# plugin-deploy-nginx 踩坑

- 多站点共存：只增 `sites-available/<新域>`，勿改 moneyhunt `/opc/*`
- certbot：先 HTTP webroot，再写 443；`www` 子域 DNS 未解析时只签裸域
- reload 前必须 `nginx -t`；失败 conf 会导致全站挂
- DSH `/dsh/` 反代缺 Upgrade → UI 一直 reconnecting
