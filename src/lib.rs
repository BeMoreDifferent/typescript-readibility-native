use dom_smoothie::Readability;
use napi::bindgen_prelude::{Error, Result, Status};
use napi_derive::napi;
use serde_json::Value;
use thiserror::Error;

#[derive(Error, Debug)]
enum NativeError {
  #[error("html must not be empty")]
  EmptyHtml,
  #[error("readability init failed: {0}")]
  Init(String),
  #[error("parse failed: {0}")]
  Parse(String),
  #[error("serialization failed: {0}")]
  Serialize(String),
}

impl From<NativeError> for Error {
  fn from(value: NativeError) -> Self {
    let status = match value {
      NativeError::EmptyHtml => Status::InvalidArg,
      NativeError::Init(_) | NativeError::Parse(_) | NativeError::Serialize(_) => {
        Status::GenericFailure
      }
    };
    Error::new(status, value.to_string())
  }
}

#[napi]
pub fn version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}

/// Parse HTML to JSON using dom_smoothie (Readability port).
#[napi]
pub fn parse_html(html: String, url: Option<String>) -> Result<Value> {
  if html.trim().is_empty() {
    return Err(NativeError::EmptyHtml.into());
  }

  let mut readability = Readability::new(html.as_str(), url.as_deref(), None)
    .map_err(|e| NativeError::Init(e.to_string()))?;

  let article = readability
    .parse()
    .map_err(|e| NativeError::Parse(e.to_string()))?;

  serde_json::to_value(article).map_err(|e| NativeError::Serialize(e.to_string()).into())
}

#[napi(object)]
pub struct BatchResult {
  pub ok: Option<Value>,
  pub error: Option<String>,
}

/// Parse many HTML documents in one JS->Rust call to minimize overhead.
#[napi]
pub fn parse_many(
  inputs: Vec<(String, Option<String>)>,
) -> Result<Vec<BatchResult>> {
  let mut out = Vec::with_capacity(inputs.len());
  for (html, url) in inputs {
    if html.trim().is_empty() {
      out.push(BatchResult {
        ok: None,
        error: Some(NativeError::EmptyHtml.to_string()),
      });
      continue;
    }

    let item = (|| -> Result<Value> {
      let mut readability = Readability::new(html.as_str(), url.as_deref(), None)
        .map_err(|e| NativeError::Init(e.to_string()))?;
      let article = readability
        .parse()
        .map_err(|e| NativeError::Parse(e.to_string()))?;
      serde_json::to_value(article)
        .map_err(|e| NativeError::Serialize(e.to_string()).into())
    })();

    match item {
      Ok(val) => out.push(BatchResult { ok: Some(val), error: None }),
      Err(err) => out.push(BatchResult { ok: None, error: Some(err.reason) }),
    }
  }
  Ok(out)
}
