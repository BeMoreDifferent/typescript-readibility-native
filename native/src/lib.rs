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

#[cfg(test)]
mod tests {
  use super::*;
  use dom_query::Document;

  // Snapshot of the pre-fix logic to demonstrate the panic condition.
  fn legacy_simplify_panics(html: &str) -> bool {
    let doc = Document::from(html);
    let page = doc.select(".page");
    let ancestor = page.select("#middle").nodes().first().cloned();
    let descendant = page.select("#inner").nodes().first().cloned();
    let Some((ancestor, descendant)) = ancestor.zip(descendant) else {
      return false;
    };

    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
      for node in [ancestor, descendant].iter().rev() {
        // Old implementation panicked when parent nodes were removed earlier in the loop.
        let parent = node.parent().expect("missing parent");
        for attr in parent.attrs() {
          node.set_attr(&attr.name.local, &attr.value);
        }
        parent.replace_with(&node.id);
      }
      page.select(":is(div, section):empty").remove();
    }))
    .is_err()
  }

  #[test]
  fn parse_html_handles_stacked_only_children_without_panic() {
    let candidates = [
      r#"
        <div class="page">
          <div id="outer">
            <div id="middle">
              <div id="inner"><p>Text</p></div>
            </div>
          </div>
        </div>
      "#,
      r#"
        <div class="page">
          <section id="outer">
            <div id="middle">
              <section id="inner"><p>Text</p></section>
            </div>
          </section>
        </div>
      "#,
      r#"
        <div class="page">
          <div id="outer"><div id="middle"><div id="inner"><p>Text</p></div></div></div>
        </div>
      "#,
    ];
    let mut found_panic = false;
    for sample in candidates {
      if legacy_simplify_panics(sample) {
        found_panic = true;
        break;
      }
    }
    assert!(found_panic, "expected at least one legacy run to panic");

    let html = "<html><body><div><div><div><p>Keep me</p></div></div></div></body></html>";
    let parsed = parse_html(html.to_string(), None).expect("native parse_html succeeds");
    let text = parsed["text_content"].as_str().unwrap_or_default();
    assert!(text.contains("Keep me"));
    assert!(
      parsed["content"]
        .as_str()
        .unwrap_or_default()
        .contains("Keep me")
    );
  }
}
