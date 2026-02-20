import {ChatMessageHandler} from "@/infra/sillytarvern";
import {Openapi} from "@/infra/openapi";

export class AutoConfig{
    static init(){
        ChatMessageHandler.init();
        Openapi.init();
    }
}
