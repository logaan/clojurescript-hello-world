(ns hello
  (:require [goog.dom :as dom]))

(defn greet [n]
  (str "hi " n))

(defn heading [s]
  (dom/createDom "h1" nil s))

(defn ^:export writeGreet [n]
  (let [word (heading (greet "foo"))
        body (. (dom/getDocument) -body)]
    (dom/appendChild body word)))

