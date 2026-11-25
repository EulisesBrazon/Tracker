import test from 'node:test';
import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';
import tls from 'node:tls';
import {
  extractAiaIssuerUrls,
  isTlsCertificateError,
  normalizePemBundle,
  splitPemBlocks,
} from './bcvScraperHelper-V2';

test('extractAiaIssuerUrls ignores CRL URL and binary ASN.1 bytes before AIA .crt URL', () => {
  // Exact byte pattern observed in BCV's OV certificate (CRL Distribution Points followed by AIA)
  const derLikeBuffer = Buffer.from(
    'http://crl.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crl0\x81\x84\x06\x08+\x06\x01\x05\x05\x07\x01\x01\x04x0v0O\x06\x08+\x06\x01\x05\x05\x070\x02\x86Chttp://crt.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crt0#\x06\x08+\x06\x01\x05\x05\x070\x01\x86\x17http://ocsp.sectigo.com',
    'latin1'
  );

  const urls = extractAiaIssuerUrls(derLikeBuffer);
  assert.deepEqual(urls, ['http://crt.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crt']);
});

test('extractAiaIssuerUrls handles adjacent ASCII URLs without binary separator', () => {
  const derLikeBuffer = Buffer.from(
    'http://crl.example.com/ca.crl0http://crt.example.com/intermediate.crt0#',
    'latin1'
  );

  const urls = extractAiaIssuerUrls(derLikeBuffer);
  assert.deepEqual(urls, ['http://crt.example.com/intermediate.crt']);
});

test('extractAiaIssuerUrls parses CA Issuers URIs from X509Certificate.infoAccess (including extensionless URIs)', () => {
  const fakeCert = Object.create(X509Certificate.prototype) as X509Certificate;
  Object.defineProperty(fakeCert, 'infoAccess', {
    value: [
      'CA Issuers - URI:http://crt.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crt',
      'CA Issuers - URI:http://r10.i.lencr.org/',
      'OCSP - URI:http://ocsp.sectigo.com',
    ].join('\n'),
  });
  Object.defineProperty(fakeCert, 'raw', { value: Buffer.alloc(0) });

  const urls = extractAiaIssuerUrls(fakeCert);
  assert.deepEqual(urls, [
    'http://crt.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crt',
    'http://r10.i.lencr.org/',
  ]);
});

test('normalizePemBundle deduplicates certificates and drops expired ones', () => {
  const roots = tls.rootCertificates.slice(0, 2);
  assert.equal(roots.length, 2);

  const combined = normalizePemBundle([roots[0], roots[0], roots[1]], new Date('2025-01-01T00:00:00Z'));
  assert.equal(splitPemBlocks(combined).length, 2);

  const farFuture = normalizePemBundle([roots[0], roots[1]], new Date('2099-01-01T00:00:00Z'));
  assert.equal(farFuture, '');
});

test('isTlsCertificateError classifies leaf verification errors and ignores network timeouts', () => {
  assert.equal(isTlsCertificateError({ code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }), true);
  assert.equal(isTlsCertificateError(new Error('unable to verify the first certificate')), true);
  assert.equal(isTlsCertificateError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }), false);
});
