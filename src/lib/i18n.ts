import { i18n } from "@lingui/core";
import { messages as enMessages } from "../locales/en/messages";
import { messages as ruMessages } from "../locales/ru/messages";

i18n.load("en", enMessages);
i18n.load("ru", ruMessages);
i18n.activate("ru");

export { i18n };
