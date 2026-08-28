export function validId(id){return typeof id==="string"&&/^[A-Za-z0-9_-]{1,128}$/.test(id);}
export function positiveInt(n){return Number.isInteger(n)&&n>=0;}
export function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
export function validCropPosition(x,z,half=15){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=half&&Math.abs(z)<=half;}
